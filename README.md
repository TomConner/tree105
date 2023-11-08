# tree105

Static site for Pembroke Troop 105 Christmas Tree Drive.


## Local Testing


## Stack

This is a weird mash of a Hugo static site and a flask server. In 2022, it was just the Hugo piece with some
javascript, and in 2023, in implementing Stripe, I made it a flask service and allowed the flask service to serve the static content too. So first, Hugo renders the markdown into HTML, and then Flask can render the HTML and any
other templates into HTTP responses. Also and more importantly, Flask implements the API called by the
payment and address forms as well as the webhooks that Stripe calls.

### Hugo

Depends on Hugo and uses a theme via a git submodule.  First time after cloning you may have to

```sh
git submodule update --init --recursive
```

Then to run locally, install Hugo and its prerequisites and then `hugo server`.

```sh
go version
sass --version # or brew install sass/sass/sass
hugo version # or brew install hugo
hugo server
```

### Flask

Start local Hugo and Flask servers:

```sh
hugo server &
cd server
python server.py
```

To stop, Ctrl-C to stop Flask and `kill %1` to stop Hugo (assuming it started as job 1).
