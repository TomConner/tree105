#!/usr/bin/env python

# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, To, Cc, Bcc, Personalization
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

import os
import requests
import json
import click
import dotenv
from pprint import pprint
from datetime import datetime
from pathlib import Path


STAMP: datetime = datetime.utcnow()

@click.group()
def cli():
    pass

def to_int(s:str):
    if s is None:
        return 0
    if s == "":
        return 0
    return int(s)

def order_amount(order):
    return (to_int(order['numtrees']) * 15 + to_int(order['extra']))

class EmailLog:
    def __init__(self, email_log: Path):
        self.email_log = email_log
        if self.email_log.exists():
            with open(self.email_log) as f:
                self.events = json.load(f)
        else:
            self.events = []

    def event(self, email, batch, row, html_content):
        #print(f"Logging {email} sent on batch {batch}")
        self.events.append({
            "stamp": str(STAMP),
            "email": email,
            "batch": batch,
            "row": row,
            "html_content": html_content
        })
        self.flush()

    def has_event(self, email, batch):
        return any([
            event['email'] == email and event['batch'] == batch
            for event in self.events
        ])

    def flush(self):
        with open(self.email_log, 'w') as f:
            json.dump(self.events, f)

@click.command()
@click.argument('batch', type=click.Choice(['status-last-minute', 'registered', 'paid', 'payment-reminder', 'pickup-reminder', 'pickup']))
@click.option('--dry-run', is_flag=True, help="Don't actually send emails")
def sendem(batch: str, dry_run: bool = False):

    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    #print(os.environ.get('SENDGRID_API_KEY')[3:6])

    #with open(f"/home/tom/tree105/work/regs.json") as f:
    with open(f"/tree105/bin/email-confirm.json") as f:
        emails = json.load(f)

    email_log = EmailLog(Path("/home/tom/tree105/work/email-log.json"))

    numrows = 0
    html_content = ""
    for row in emails:
        print(f"considering {row['email']}")
        if email_log.has_event(row['email'], batch):
            if dry_run:
                print(f"dry_run: skipping because sent previously on {batch}: {row['email']}")
            continue

        html_content = ""
        html_content += f"<p>Greetings {row['name']}</p>\n\n"
        if row['numtrees2024']:
            html_content += "<p>Thank you for participating in last year's pickup.  We picked \n"
            html_content += f"up from <strong>{row['address2024']}</strong> in 2024. We appreciate your support!</p>\n\n"

        if row['numtrees2025']:
            html_content += "<p>You are <strong>confirmed</strong> for pickup this Saturday, January 4, 2025. \n"
            html_content +="Thank you for your support!</p>\n\n"
            amt_received = row['stripe2025']
            if amt_received:
                html_content += f"<p>We have received your online payment of <strong>${amt_received:.2f}</strong> - Thank You!</p>\n\n"
            else:
                html_content += "<p>We have <strong>not</strong> received payment for this Saturday's pickup. \n"
                html_content += "Please leave payment on the tree, or pay on the registration "
                html_content += "page at https://troop105treedrive.com.</p>\n\n"

        else:
            html_content += "<p>We do <strong>not</strong> have you listed for pickup this Saturday. If you would like \n"
            html_content += "your tree picked up this year, please register at https://troop105treedrive.com \n"
            html_content += "or email now.</p>\n\n"
        
        html_content += "<p>If any of the above information is in error, please email us at treedrive105@gmail.com.</p>"
        html_content += "<p>Troop 105</p>"

        subject='Troop 105 Tree Pickup Confirmation'

        
        message = Mail(
            from_email=('troop@troop105.net', 'Troop 105'),
            subject=subject,
            html_content=html_content)

        personalization = Personalization()
        personalization.add_to(To(row['email'], row['name']))
        personalization.add_cc(Cc("treedrive105@gmail.com", "Troop 105 Tree Drive"))
        message.add_personalization(personalization)

        if dry_run:
            print(f"dry_run: sending {row}")
        else:
            print(f"sending {row}")
            print(html_content)
            response = sg.send(message)
            if (response.status_code >= 200 and response.status_code <= 299 ):
                email_log.event(row['email'], batch, row, html_content)
            else:
                print(f"Failure {response.status_code} {response.body} {response.headers}")

if __name__ == '__main__':
    dotenv.load_dotenv("/tree105/.env")
    cli.add_command(sendem)
    cli()
