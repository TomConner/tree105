#!/usr/bin/env python
import os
import base64
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
import dotenv
dotenv.load_dotenv()

TREE_MAILER_SECRET = os.environ['TREE_MAILER_SECRET']

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

def get_gmail_service():
    creds = None
    
    try:
        secret_info = json.loads(TREE_MAILER_SECRET)
    except json.JSONDecodeError:
        print("TREE_MAILER_SECRET is not valid JSON")
        return None

    if secret_info.get("type") == "service_account":
        creds = service_account.Credentials.from_service_account_info(
            secret_info, scopes=SCOPES
        )
        # Delegate to the user we want to send email as
        creds = creds.with_subject("troop@troop105.net")
        
        try:
            service = build("gmail", "v1", credentials=creds)
            return service
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None

    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_config(secret_info, 
                                                       SCOPES)
            creds = flow.run_local_server(port=0)
            # Save the credentials for the next run
            with open("token.json", "w") as token:
                token.write(creds.to_json())

    try:
        service = build("gmail", "v1", credentials=creds)
        return service
    except HttpError as error:
        print(f"An error occurred: {error}")
        return None

def send_email(to_email, subject, html_content):
    service = get_gmail_service()
    if not service:
        print("Failed to create Gmail service.")
        return

    message = MIMEText(html_content, "html")
    message["to"] = to_email
    message["from"] = "Troop 105 Tree Pickup <troop@troop105.net>"
    message["reply-to"] = "Troop 105 Tree Pickup Questions <troop+tree@troop105.net>"
    message["subject"] = subject
    
    # Encode the message
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    body = {"raw": raw_message}

    try:
        message = (
            service.users()
            .messages()
            .send(userId="me", body=body)
            .execute()
        )
        print(f"Message Id: {message['id']}")
        return message
    except HttpError as error:
        print(f"An error occurred: {error}")

if __name__ == "__main__":
    # Example usage
    to_email = os.environ["TEST_EMAIL_RECIPIENT"]
    subject = "Test Email from Tree105"
    html_content = "<h1>This is a test email sent from Tree105 server.</h1>"
    send_email(to_email, subject, html_content)