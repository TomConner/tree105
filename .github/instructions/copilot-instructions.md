# Project Overview

## Features
This project is a user registration application for a christmas tree pickup service run in Pembroke, MA by volunteers in a local scout troop. The service happens annually on one Saturday in January.
* users can sign up and register for christmas tree pickup
* users can make payments via Stripe
* users receive email confirmations 
* pickup addresses are placed on a map for organizers to plan pickup routes
* organizers can manage user registrations via an admin UI
* organizers can monitor registrations and payments via dashboards 

## API Server
* expose REST API endpoints using Flask
* serve static site files
* initiate user payments in Stripe
* receive Stripe notifications via webhooks
* send email confirmations via SendGrid
* receive SendGrid event webhooks
* store user data in sqlite database

## Authentication and Authorization
* Users register with a simple magic link sent via email
* Admin users are authorized with an allow list of email addresses

## Directory Structure
* `generator/` legacy hugo UI 
* `public/` generated hugo static site
* `server/` backend API server code
* `admin-app/` React UI, currently with admin only, but intended to replace user registration UI too
* `caddy/` Caddy configuration for production deployment

## Tech Stack
* Frontend User UI
  * (Legacy) hugo static site generator with hand-coded hugo shortcodes
* Frontend Admin UI
  * React for frontend UI
  * Vite for frontend build tool
  * Tailwind CSS for styling
* Backend API
  * Python 3.12
  * Flask
  * Peewee ORM and hand-coded SQL queries
  * SQLite for user data storage
  * Stripe for payments
  * SendGrid for email confirmations
* Production Deployment
  * Docker and docker-compose for production deployment
  * Caddy for production serving static site and reverse proxying API server
  * Gunicorn for serving production Flask API server

### Production Deployment
Production environment uses Docker and `docker-compose` on a DigitalOcean droplet
* `caddy` service runs Caddy to serve static site and reverse proxy to API server
* `generator` service runs hugo in development mode and should be removed from production 
* `server` service uses gunicorn to serve Flask API server

### Development
Can be run locally without Docker for development.
* uses `.env` for environment variables
* runs API server on port 4242
* should use vite dev server for admin UI on port 5173


# Workspace Operations Guide

## Overview
This project combines:
- Hugo static site ([generator/](generator))
- Flask API and server logic ([server/server.py](server/server.py))
- React + Vite admin dashboard ([admin-app/](admin-app))
- SQLite persistence ([server/treedb.py](server/treedb.py))
- Email batch scripts ([bin/emails](bin/emails), [bin/email-confirm.py](bin/email-confirm.py))
- Backup and maintenance scripts ([bin/backup.sh](bin/backup.sh), [bin/daily-server.sh](bin/daily-server.sh), [bin/daily-client.sh](bin/daily-client.sh), [bin/dev-admin.sh](bin/dev-admin.sh))

## Key Runtime Components
- Flask endpoints: authentication (`[`requires_auth`](server/server.py)`), payment config (`[`get_config`](server/server.py)`), payment intent creation, webhooks, address/order posting, pickups/export, email history.
- DB models and lifecycle: [`Lookup`](server/treedb.py), [`Order`](server/treedb.py), [`Address`](server/treedb.py), [`Intent`](server/treedb.py); connection hooks (`[`before_request`](server/treedb.py)`, `[`teardown_request`](server/treedb.py)`).
- Front-end registration flow: order form JS ([generator/static/js/register-form.js](generator/static/js/register-form.js)), Stripe payment frame ([generator/content/register/stripe-payment.js](generator/content/register/stripe-payment.js)), return handling ([generator/content/confirm/stripe-return.js](generator/content/confirm/stripe-return.js)).
- Admin dashboard consumes protected endpoints ([admin-app/src/App.tsx](admin-app/src/App.tsx), [admin-app/src/TabbedDashboard.tsx](admin-app/src/TabbedDashboard.tsx), Vite proxy config in [admin-app/vite.config.ts](admin-app/vite.config.ts)).

## Environment Variables
Configured in root [.env](.env). Required:
- STRIPE_PUBLISHABLE_KEY / STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
- USERS (comma-separated user:password pairs used by [`check_auth`](server/server.py))
- TREE_HOME (used by DB path logic in [server/treedb.py](server/treedb.py))
Confirm via `printenv | grep STRIPE` and review loading in [server/server.py](server/server.py).

## Local Development (Debug)
1. Sync submodules: `git submodule update --init --recursive` (Hugo theme: [generator/themes/soho](generator/themes/soho)).
2. Start Hugo for rapid content iteration (optional if Flask serves built output):
   - From `generator/`: `hugo server`
3. Start Flask API:
   - From `server/`: `python server.py` (see [server/README.md](server/README.md))
   - Logs use JSON formatter (`JsonFormatter` in [server/server.py](server/server.py))
4. Start Admin App (React):
   - From `admin-app/`: `npm install` then `npm run dev`
   - Vite dev server proxies `/api` to Flask per [admin-app/vite.config.ts](admin-app/vite.config.ts)
5. Database inspection:
   - Latest backup in `work/`; direct model logic in [server/treedb.py](server/treedb.py)
   - Use helper script [bin/tree-sql](bin/tree-sql) for quick queries.
6. Stripe testing:
   - Confirm publishable key via GET `/api/v1/config`
   - Exercise payment intent creation `/api/v1/create-payment-intent/<lookup>`
7. Email dry runs:
   - `python bin/emails sendem registered --dry-run`
   - `python bin/email-confirm.py sendem pickup-reminder --dry-run`
   - Avoid duplicate sends using `EmailLog` path set in scripts.
8. Authentication debug:
   - Hit `/api/protected` with Basic header matching `USERS` parsed in [server/server.py](server/server.py)

## Database Lifecycle
- Auto-initialized if missing in [`treedb_init`](server/treedb.py).
- Lookup codes via [`new_lookup`](server/treedb.py) consumed by registration JS.
- Order total logic unified (`[`order_amount`](server/server.py)`, JS mirror in [generator/static/js/register-form.js](generator/static/js/register-form.js)).

## Registration / Payment Flow (Trace)
1. User loads form shortcode ([generator/layouts/shortcodes/register-form.html](generator/layouts/shortcodes/register-form.html)) → JS initializes lookup.
2. Order posted to `/api/v1/orders/<lookup>` then Stripe intent requested.
3. Stripe iframe script ([generator/content/register/stripe-payment.js](generator/content/register/stripe-payment.js)) mounts address + payment elements.
4. After payment redirect → `/return` content ([generator/content/return/index.md](generator/content/return/index.md)) plus Stripe status frame ([generator/content/confirm/stripe-return.js](generator/content/confirm/stripe-return.js)).

## Admin Dashboard
- Fetches pickups `/api/v1/pickups` and email history `/api/v1/email_history` (see routes in [server/server.py](server/server.py) near protected endpoints).
- CSV export logic in [`PickupsDashboard`](admin-app/src/PickupsDashboard.tsx).
- Auth stored in `localStorage` (see [`AuthProvider`](admin-app/src/AuthContext.tsx)).

## Logging & Monitoring
- JSON structured logs via `sg_logger` and Flask `app.logger` in [server/server.py](server/server.py).
- Capture SendGrid responses in email batch scripts (manual POST in [bin/emails](bin/emails)).
- For latency anomalies wrap critical calls with timing and print `sg_data` payload if extending `JsonFormatter`.

## Backup & Maintenance
Scripts:
- Daily remote → local: [bin/daily-client.sh](bin/daily-client.sh) triggers remote [bin/daily-server.sh](bin/daily-server.sh) and fetches zip.
- Zip creation and logs capture: [bin/backup.sh](bin/backup.sh)
- Development DB refresh + view imports: function `pb()` and others inside [bin/dev-admin.sh](bin/dev-admin.sh).

## Production Build & Run
Option A (Docker multi-service):
1. Build server image: `docker buildx build server -t tomconner/tree105:latest`
3. Build Hugo static assets:
   - `cd generator && hugo --minify`
4. Build Admin App:
   - `cd admin-app && npm run build` (output to `public/app` per [admin-app/vite.config.ts](admin-app/vite.config.ts))
5. Compose deployment referencing `compose.yaml` / `docker-compose.yaml` (adjust volumes for `/tree105/db`).
6. Ensure `.env` mounted read-only; set `TREE_HOME` inside container; persistent volume for database.
7. Reverse proxy Caddy terminates TLS and forwards `/api` to Flask, other paths to static.

## SendGrid & Email
- Test script: [server/testsendgrid.py](server/testsendgrid.py) and local variants [bin/sgtest.py](bin/sgtest.py).
- Template SendGrid dynamic payload in [bin/emails](bin/emails); confirmation formatting in [bin/email-confirm.py](bin/email-confirm.py).

## Security Notes
- Replace Basic Auth (`[`check_auth`](server/server.py)`) with stronger method (token or session) before scaling.
- Do not log secrets. Review any `print` debug of auth credentials (present in `check_auth` TODO region).
- Limit email batch execution to controlled environment (avoid accidental mass send—use `--dry-run` first).

## Common Debug Tasks
- Rebuild DB views: use `.read email-history-view.sql` etc (triggered in [bin/dev-admin.sh](bin/dev-admin.sh)).
- Force new lookup: Call POST `/api/v1/lookups` then inspect localStorage in browser dev tools.
- Payment stuck: Inspect PaymentIntent in Stripe dashboard matching lookup code present in DB (`Lookup` + `Intent` tables).
- Email resend blocked: Remove event entry from `email-log.json` then re-run with `--dry-run` to verify.

## Deployment Checklist
- [x] `.env` populated (Stripe, USERS, TREE_HOME)
- [x] Static assets rebuilt (Hugo + Admin)
- [x] Webhook endpoint `/api/v1/webhook` reachable and STRIPE_WEBHOOK_SECRET set
- [x] Backups scheduled (cron invoking [bin/backup.sh](bin/backup.sh))
- [x] Logs aggregated (container stdout → central collector)
- [x] Basic Auth rotated or replaced

## Future Improvements
- Replace Basic Auth with OAuth/OpenID.
- Add unit tests for DB operations and payment flow.
- Add structured email event persistence (instead of JSON file in scripts).
- Introduce rate limiting on POST routes.
- Migrate to Postgres if write volume grows.

## Reference Index
- Server core: [server/server.py](server/server.py)
- DB models: [server/treedb.py](server/treedb.py)
- Registration form: [generator/static/js/register-form.js](generator/static/js/register-form.js)
- Stripe frame: [generator/content/register/stripe-payment.js](generator/content/register/stripe-payment.js)
- Return handling: [generator/content/confirm/stripe-return.js](generator/content/confirm/stripe-return.js)
- Admin dashboard: [admin-app/src/App.tsx](admin-app/src/App.tsx)
- Email batch: [bin/emails](bin/emails), [bin/email-confirm.py](bin/email-confirm.py)
- Backup: [bin/backup.sh](bin/backup.sh)
- Daily sync: [bin/daily-client.sh](bin/daily-client.sh), [bin/daily-server.sh](bin/daily-server.sh)