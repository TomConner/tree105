#! /usr/bin/env python3.8
import stripe
import json
import os

from flask import Flask, jsonify, request
from dotenv import load_dotenv, find_dotenv

import db

load_dotenv(find_dotenv())

# For sample support and debugging, not required for production:
# stripe.set_app_info(
#     'stripe-samples/accept-a-payment/payment-element',
#     version='0.0.2',
#     url='https://github.com/stripe-samples')

stripe.api_version = '2020-08-27'
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

app = Flask(__name__)

def amount_from_request(data):
    app.logger.info("amount_from_request")
    app.logger.info(data)
    amount = data["trees"] * 15 + data["extra"]
    return amount*100

# This hook ensures that a connection is opened to handle any queries
# generated by the request.
@app.before_request
def db_before_request():
    db.before_request()

# This hook ensures that the connection is closed when we've finished
# processing the request.
@app.teardown_request
def db_teardown_request(exc):
    db.teardown_request()

@app.route('/api/v1/config', methods=['GET'])
def get_config():
    app.logger.info('config')
    return jsonify({'publishableKey': os.getenv('STRIPE_PUBLISHABLE_KEY')})

@app.route('/api/v1/pickups', methods=['GET'])
def get_pickups():
    app.logger.info(f"pickup")
    return jsonify([p for p in db.get_pickups()])

@app.route('/api/v1/pickups/<lookup>', methods=['GET'])
def get_pickup(lookup):
    app.logger.info(f"pickup {lookup}")
    return jsonify(db.get_pickup(lookup))

@app.route('/api/v1/pickups', methods=['POST'])
def post_pickup():
    app.logger.info(f"post pickup")
    return str(db.create_pickup())

@app.route('/api/v1/pickups/<lookup>', methods=['PUT'])
def put_pickup(lookup):
    app.logger.info(f"post pickup")
    return str(db.update_pickup(lookup))

@app.route('/api/v1/create-payment-intent', methods=['POST'])
def create_payment():
    # Create a PaymentIntent with the amount, currency, and a payment method type.
    #
    # See the documentation [0] for the full list of supported parameters.
    #
    # [0] https://stripe.com/docs/api/payment_intents/create
    try:
        data = json.loads(request.data)
        intent = stripe.PaymentIntent.create(
            amount=amount_from_request(data),
            currency='usd',
            # TODO force payment methods?
            automatic_payment_methods={
                'enabled': True,
            },
        )
        app.logger.info("payment-intent")

        # Send PaymentIntent details to the front end.
        return jsonify({'clientSecret': intent.client_secret})
    except stripe.error.StripeError as e:
        app.logger.error(e, stack_info=True)
        return "Error", 400
    except Exception as e:
        app.logger.error(e, stack_info=True)
        return "Error", 500


@app.route('/api/v1/webhook', methods=['POST'])
def webhook_received():
    # You can use webhooks to receive information about asynchronous payment events.
    # For more about our webhook events check out https://stripe.com/docs/webhooks.
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    request_data = json.loads(request.data)

    if webhook_secret:
        # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
        signature = request.headers.get('stripe-signature')
        try:
            event = stripe.Webhook.construct_event(
                payload=request.data, sig_header=signature, secret=webhook_secret)
            data = event['data']
        except Exception as e:
            app.logger.error(e, stack_info=True)
            return 500
        # Get the type of webhook event sent - used to check the status of PaymentIntents.
        event_type = event['type']
    else:
        data = request_data['data']
        event_type = request_data['type']
    data_object = data['object']

    if event_type == 'payment_intent.succeeded':
        print('💰 Payment received!')
        # Fulfill any orders, e-mail receipts, etc
        # To cancel the payment you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    elif event_type == 'payment_intent.payment_failed':
        print('❌ Payment failed.')
    return jsonify({'status': 'success'})


if __name__ == '__main__':
    db.init_or_connect()
    app.run(host='0.0.0.0', port=4242, debug=True)