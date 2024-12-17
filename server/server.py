#! /usr/bin/env python3.8
import stripe
import json
import os
import gzip
import logging
from io import BytesIO

from flask import Flask, jsonify, request, abort
from dotenv import load_dotenv, find_dotenv
from playhouse.shortcuts import model_to_dict

from treedb import create_address, get_last_address, create_order, create_intent, get_last_order, Address, Order, Lookup
from playhouse.shortcuts import model_to_dict
import treedb

load_dotenv(find_dotenv())

# For sample support and debugging, not required for production:
# stripe.set_app_info(
#     'stripe-samples/accept-a-payment/payment-element',
#     version='0.0.2',
#     url='https://github.com/stripe-samples')

stripe.api_version = '2020-08-27'
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

import logging
import json
from datetime import datetime


class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'logger': record.name
        }

        if hasattr(record, 'sg_data'):
            log_data['sg_data'] = record.sg_data

        return json.dumps(log_data)

# Changed from request_logger to sg_logger
sg_logger = logging.getLogger('sg_logger')
sg_logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
sg_logger.addHandler(handler)

app = Flask(__name__)
app.logger.setLevel("DEBUG")
def amount_from_request(data):
    app.logger.info("amount_from_request")
    app.logger.info(data)
    amount = data["trees"] * 15 + data["extra"]
    return amount*100

# This hook ensures that a connection is opened to handle any queries
# generated by the request.
@app.before_request
def db_before_request():
    treedb.before_request()

# This hook ensures that the connection is closed when we've finished
# processing the request.
@app.teardown_request
def db_teardown_request(exc):
    treedb.teardown_request()


def to_int(s:str):
    if s is None:
        return 0
    if s == "":
        return 0
    return int(s)

def order_amount(order):
    app.logger.info(f"order_amount: {order}")
    return (to_int(order['numtrees']) * 15 + to_int(order['extra'])) * 100

#########
#
#  Stripe-related APIs

@app.route('/api/v1/config', methods=['GET'])
def get_config():
    app.logger.info('config')
    return jsonify({'publishableKey': os.getenv('STRIPE_PUBLISHABLE_KEY')})


@app.route('/api/v1/create-payment-intent/<lookup>', methods=['POST'])
def create_payment(lookup):
    # Create a PaymentIntent with the amount, currency, and a payment method type.
    #
    # See the documentation [0] for the full list of supported parameters.
    #
    # [0] https://stripe.com/docs/api/payment_intents/create
    try:
        # data = json.loads(request.data)
        amount = order_amount(treedb.get_last_order(lookup))
        app.logger.info(f"amount: {amount}")
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            # TODO force payment methods?
            automatic_payment_methods={
                'enabled': False,
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

#########
#
#  Address and Order APIs

@app.route('/api/v1/addresses/<lookup_code>', methods=['POST'])
def post_address(lookup_code):
    data = request.json
    app.logger.info(data)
    result = create_address(lookup_code, **data)
    return jsonify(result), 201 if isinstance(result, dict) else 400

@app.route('/api/v1/orders/<lookup_code>', methods=['POST'])
def post_order(lookup_code):
    data = request.json
    app.logger.info(data)
    result = create_order(lookup_code, **data)
    return jsonify(result), 201 if isinstance(result, dict) else 400

@app.route('/api/v1/intents/<lookup_code>', methods=['POST'])
def post_intent(lookup_code):
    data = request.json
    app.logger.info(data)
    result = create_intent(lookup_code, **data)
    return jsonify(result), 201 if isinstance(result, dict) else 400

@app.route('/api/v1/addresses/<lookup_code>', methods=['GET'])
def get_last_address_route(lookup_code):
    address = get_last_address(lookup_code)
    return jsonify(address) if address else ('', 404)

@app.route('/api/v1/orders/<lookup_code>', methods=['GET'])
def get_last_order_route(lookup_code):
    order = get_last_order(lookup_code)
    return jsonify(order) if order else ('', 404)

@app.route('/api/v1/addresses', methods=['GET'])
def get_all_addresses():
    addresses = [model_to_dict(address) for address in Address.select()]
    return jsonify(addresses)

@app.route('/api/v1/orders', methods=['GET'])
def get_all_orders():
    orders = [model_to_dict(order) for order in Order.select()]
    return jsonify(orders)

@app.route('/api/v1/addresses/<lookup_code>', methods=['GET'])
def get_addresses_for_lookup(lookup_code):
    try:
        addresses = [model_to_dict(address) for address in Address.select().join(Lookup).where(Lookup.code == lookup_code)]
        return jsonify(addresses)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/v1/orders/<lookup_code>', methods=['GET'])
def get_orders_for_lookup(lookup_code):
    try:
        orders = [model_to_dict(order) for order in Order.select().join(Lookup).where(Lookup.code == lookup_code)]
        return jsonify(orders)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# @app.route('/api/v1/lookups', methods=['GET'])
# def get_lookups():
#     app.logger.info(f"lookup")
#     return jsonify([p for p in treedb.get_lookups()])

@app.route('/api/v1/lookups', methods=['POST'])
def post_lookup():
    app.logger.info(f"POST lookup")
    return treedb.new_lookup()

@app.route('/api/v1/emailevents', methods=['POST'])
def post_emailevents():
    # Check if the request is gzipped
    if request.headers.get('Content-Encoding') == 'gzip':
        # Decompress the data
        compressed_data = BytesIO(request.data)
        decompressed_data = gzip.GzipFile(fileobj=compressed_data).read()
        # Parse the JSON after decompressing
        json_data = json.loads(decompressed_data)
    else:
        json_data = request.get_json()
    sg_logger.info(f"emailevents", extra={"sg_data": json_data})
    return 'OK\n', 200


if __name__ == '__main__':
    treedb.init_or_connect()
    app.run(host='0.0.0.0', port=4242, debug=True)
