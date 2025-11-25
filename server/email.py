#!/usr/bin/env python
# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
import os
import logging

from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()
SENDGRID_API_KEY = os.environ['SENDGRID_API_KEY']

def send_email(to_email, subject, html_content):
    message = Mail(
        from_email='troop@troop105.net',
        to_emails=to_email,
        subject=subject,
        html_content=html_content)
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)
    except Exception as e:
        print(e.message)
