# Stripe webhook routes - source of truth for order recording
import logging
import os

import stripe
from flask import Blueprint, request, jsonify

from database import Database
from services.sms import sms_service

logger = logging.getLogger(__name__)

webhooks_bp = Blueprint('webhooks', __name__)

# Realistically limited amount (cents) rather than trusting price math; the
# exact paid amount comes from Stripe's session object.
def _record_completed_order(session_object):
    """Record a paid order (exchange + payment) idempotently from a Stripe
    Checkout Session object. Returns True if newly recorded, False if skipped
    (already processed)."""
    if not session_object or session_object.get('payment_status') != 'paid':
        return False

    session_id = session_object.get('id')
    metadata = session_object.get('metadata') or {}

    customer_id = metadata.get('customer_id') or session_object.get('client_reference_id')
    can_type = metadata.get('can_type')
    quantity = metadata.get('quantity')
    date = metadata.get('date')

    if not all([customer_id, can_type, quantity, date]):
        logger.warning("Webhook for session %s missing metadata", session_id)
        return False

    # Idempotency guard: the same session has already been recorded.
    existing = Database.execute_query(
        "SELECT payment_id FROM payments WHERE stripe_session_id = %s",
        (session_id,),
        fetch_one=True
    )
    if existing:
        logger.info("Session %s already recorded; skipping", session_id)
        return False

    payment_intent = session_object.get('payment_intent')
    payment_intent_id = payment_intent if isinstance(payment_intent, str) else None
    amount_paid = session_object.get('amount_total')  # cents

    try:
        exchange_id = Database.execute_insert(
            """INSERT INTO exchanges (customer_id, time, date, num_cans, can_type)
               VALUES (%s, %s, %s, %s, %s)""",
            (int(customer_id), 'day', date, int(quantity), can_type)
        )

        Database.execute_insert(
            """INSERT INTO payments
               (customerid, exchange_id, can_type, numcans,
                stripe_session_id, stripe_payment_intent_id, amount_paid, status)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (int(customer_id), exchange_id, can_type, int(quantity),
             session_id, payment_intent_id, amount_paid, 'paid')
        )

        # Fetch the customer phone for the confirmation SMS
        customer = Database.execute_query(
            "SELECT phone FROM customers WHERE customer_id = %s",
            (int(customer_id),),
            fetch_one=True
        )
        if customer and customer.get('phone'):
            order_date = date.replace('_', '/')
            sms_service.send_order_confirmation(
                customer['phone'],
                order_date,
                can_type
            )

        logger.info("Recorded order for session %s (exchange %s)", session_id, exchange_id)
        return True
    except Exception:
        logger.exception("Failed to record order for session %s", session_id)
        raise


@webhooks_bp.route('/stripe', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events."""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

    if not endpoint_secret:
        logger.error("STRIPE_WEBHOOK_SECRET is not configured; returning 200 to avoid Stripe retries")
        return jsonify({'received': True}), 200

    if not sig_header:
        return jsonify({'error': 'Missing Stripe-Signature header'}), 400

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        # Invalid payload
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return jsonify({'error': 'Invalid signature'}), 400

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session_object = event['data']['object']
        try:
            _record_completed_order(session_object)
        except Exception:
            logger.exception("Error handling checkout.session.completed")
            # Return 500 so Stripe retries; we are idempotent on session id.
            return jsonify({'error': 'Failed to process event'}), 500
    elif event['type'] == 'checkout.session.expired':
        logger.info("Checkout session expired: %s", event['data']['object'].get('id'))

    return jsonify({'received': True}), 200