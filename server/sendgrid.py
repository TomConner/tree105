# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
# import sendgrid
# import os
# from sendgrid.helpers.mail import *
# import dotenv

# dotenv.load_dotenv('.env')

# message = Mail(
#     from_email='troop@troop105.net',
#     to_emails='tomconner46@gmail.com',
#     subject='Sending with Twilio SendGrid is Fun',
#     html_content='<strong>and easy to do anywhere, even with Python</strong>')
# try:
#     sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
#     response = sg.send(message)
#     print(response.status_code)
#     print(response.body)
#     print(response.headers)
# except Exception as e:
#     print(e.message)