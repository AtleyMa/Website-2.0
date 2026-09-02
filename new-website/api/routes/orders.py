# Orders Routes
import logging

from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity

from constants import SCREW_IN, QUICK_CONNECT, CYLINDER_TYPES, SCREW_IN_MAX, QUICK_CONNECT_MAX
from database import Database
from services.sms import sms_service
from services.stripe_service import stripe_service

logger = logging.getLogger(__name__)

orders_bp = Blueprint('orders', __name__)


@orders_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_availability():
    """Get cylinder availability for a given month"""
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    if not month or not year:
        return jsonify({'message': 'Month and year are required'}), 400

    # Build a proper date range for the month instead of a LIKE pattern.
    # The `date` column stores M_D_YYYY (no zero-padding); STR_TO_DATE with
    # '%c_%e_%Y' parses it so we can compare real dates. This avoids the
    # `_` wildcard bug (e.g. '1_%_2027' matching '11_5_2027').
    start_date = f"{month}_1_{year}"
    if month == 12:
        end_date = f"12_31_{year}"
    else:
        from calendar import monthrange
        end_date = f"{month}_{monthrange(year, month)[1]}_{year}"

    exchanges = Database.execute_query(
        """SELECT date, num_cans, can_type FROM exchanges
           WHERE STR_TO_DATE(date, '%c_%e_%Y') BETWEEN STR_TO_DATE(%s, '%c_%e_%Y')
                                                   AND STR_TO_DATE(%s, '%c_%e_%Y')
           ORDER BY date""",
        (start_date, end_date)
    )
    
    # Calculate availability by day (each day is a single time slot)
    availability = {'blue': {}, 'pink': {}}
    
    for exchange in exchanges:
        day = exchange['date'].split('_')[1]
        can_key = 'blue' if exchange['can_type'] == SCREW_IN else 'pink'
        availability[can_key][day] = availability[can_key].get(day, 0) + exchange['num_cans']
    
    return jsonify(availability), 200


@orders_bp.route('/canister-type', methods=['POST'])
@jwt_required()
def set_canister_type():
    """Set the cylinder type for the order"""
    data = request.get_json(silent=True) or {}
    can_type = data.get('canType')
    
    if can_type not in CYLINDER_TYPES:
        return jsonify({'message': 'Invalid cylinder type'}), 400
    
    # Store in session or return confirmation
    session['can_type'] = can_type
    
    return jsonify({'message': 'Cylinder type set', 'canType': can_type}), 200


@orders_bp.route('/quantity', methods=['POST'])
@jwt_required()
def set_quantity():
    """Set the quantity for the order"""
    data = request.get_json(silent=True) or {}
    quantity = data.get('quantity')
    
    # Convert to int if it's a string or validate if already int
    try:
        quantity = int(quantity) if quantity is not None else None
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid quantity format'}), 400
    
    if not quantity or quantity < 1:
        return jsonify({'message': 'Invalid quantity'}), 400
    
    # Validate against max limits
    can_type = session.get('can_type', SCREW_IN)
    max_qty = QUICK_CONNECT_MAX if can_type == QUICK_CONNECT else SCREW_IN_MAX
    
    if quantity > max_qty:
        return jsonify({'message': f'Maximum {max_qty} cylinders allowed'}), 400
    
    session['quantity'] = quantity
    
    return jsonify({'message': 'Quantity set', 'quantity': quantity}), 200


@orders_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout():
    """Create a Stripe checkout session"""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    
    # Get order details
    can_type = data.get('canisterType') or session.get('can_type')
    quantity = data.get('quantity') or session.get('quantity')
    date = data.get('date')
    
    if not all([can_type, quantity, date]):
        return jsonify({'message': 'Missing order details'}), 400
    
    # Get user's Stripe ID (user_id from JWT is a string)
    user = Database.execute_query(
        "SELECT stripe_id, phone, f_name, l_name, email FROM customers WHERE customer_id = %s",
        (int(user_id),),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'message': 'User not found'}), 400
    
    if not user.get('stripe_id'):
        try:
            full_name = f"{user['f_name']} {user['l_name']}".strip()
            stripe_id = stripe_service.create_customer(full_name, user['email'])
            Database.execute_update(
                "UPDATE customers SET stripe_id = %s WHERE customer_id = %s",
                (stripe_id, int(user_id))
            )
            user['stripe_id'] = stripe_id
        except Exception:
            logger.exception("Failed to create Stripe customer for user %s", user_id)
            return jsonify({'message': 'Stripe account not configured for this user. Please contact support.'}), 400
    
    # Store order details in session for success callback
    session['pending_order'] = {
        'customer_id': user_id,
        'can_type': can_type,
        'quantity': quantity,
        'date': date,
        'phone': user['phone']
    }
    
    try:
        # Create Stripe checkout session
        checkout = stripe_service.create_checkout_session(
            stripe_customer_id=user['stripe_id'],
            can_type=can_type,
            quantity=quantity,
            date=date,
            customer_id=int(user_id)
        )
        
        return jsonify(checkout), 200
        
    except Exception:
        logger.exception("Error creating checkout session")
        return jsonify({'message': 'Failed to create checkout session'}), 500


@orders_bp.route('/confirm', methods=['POST'])
@jwt_required()
def confirm_order():
    """Confirm and record the order after successful payment"""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    
    # Get pending order from session or request
    order = session.get('pending_order') or data
    
    if not order:
        return jsonify({'message': 'No pending order found'}), 400
    
    try:
        # Insert exchange record
        exchange_id = Database.execute_insert(
            """INSERT INTO exchanges (customer_id, time, date, num_cans, can_type) 
               VALUES (%s, %s, %s, %s, %s)""",
            (
                user_id,
                'day',
                order['date'],
                order['quantity'],
                order['can_type']
            )
        )
        
        # Insert payment record
        Database.execute_insert(
            """INSERT INTO payments (customerid, exchange_id, can_type, numcans) 
               VALUES (%s, %s, %s, %s)""",
            (user_id, exchange_id, order['can_type'], order['quantity'])
        )
        
        # Send confirmation SMS
        order_date = order['date'].replace('_', '/')
        sms_service.send_order_confirmation(
            order['phone'],
            order_date,
            order['can_type']
        )
        
        # Clear pending order
        session.pop('pending_order', None)
        
        return jsonify({
            'message': 'Order confirmed',
            'exchangeId': exchange_id
        }), 201
        
    except Exception:
        logger.exception("Failed to confirm order")
        return jsonify({'message': 'Failed to confirm order'}), 500


@orders_bp.route('/history', methods=['GET'])
@jwt_required()
def get_order_history():
    """Get user's order history"""
    user_id = get_jwt_identity()
    
    exchanges = Database.execute_query(
        """SELECT date, time, num_cans, can_type 
           FROM exchanges 
           WHERE customer_id = %s 
           ORDER BY exchange_id DESC 
           LIMIT 20""",
        (user_id,)
    )
    
    return jsonify({'exchanges': exchanges}), 200


@orders_bp.route('/<int:exchange_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(exchange_id):
    """Cancel an order. Full refund if cancelled at least 24h before the
    pickup day; otherwise it's not cancellable and the customer should
    contact support."""
    user_id = get_jwt_identity()

    order = Database.execute_query(
        """SELECT e.exchange_id, e.customer_id, e.date, e.num_cans, e.can_type,
                  COALESCE(e.status, 'scheduled') as status,
                  p.payment_id, p.stripe_payment_intent_id, p.status as payment_status
           FROM exchanges e
           LEFT JOIN payments p ON e.exchange_id = p.exchange_id
           WHERE e.exchange_id = %s""",
        (exchange_id,),
        fetch_one=True
    )

    if not order:
        return jsonify({'message': 'Order not found'}), 404
    if int(order['customer_id']) != int(user_id):
        return jsonify({'message': 'Not your order'}), 403
    if order['status'] not in ('scheduled', 'ready'):
        return jsonify({'message': f'Order cannot be cancelled (status: {order["status"]})'}), 400

    from datetime import datetime, timedelta
    from calendar import monthrange
    # Parse the M_D_YYYY pickup date
    parts = order['date'].split('_')
    pickup = datetime(int(parts[2]), int(parts[0]), int(parts[1]))

    if pickup - datetime.now() < timedelta(hours=24):
        return jsonify({
            'message': 'This order is within 24 hours of pickup and can no longer be cancelled online. Please contact us for help.'
        }), 400

    try:
        Database.execute_update(
            "UPDATE exchanges SET status='cancelled' WHERE exchange_id=%s",
            (exchange_id,)
        )

        # Refund via Stripe if there is a paid Stripe payment
        refunded = False
        if order.get('stripe_payment_intent_id') and order.get('payment_status') == 'paid':
            stripe_service.create_refund(order['stripe_payment_intent_id'])
            Database.execute_update(
                "UPDATE payments SET status='refunded', refunded_at=NOW() WHERE payment_id=%s",
                (order['payment_id'],)
            )
            refunded = True

        # Notify admin about the cancellation
        sms_service.send_sms(
            '4038897632',
            f"SodaKid: Order #{exchange_id} CANCELLED by customer. "
            f"{order['num_cans']} {order['can_type']} on {order['date'].replace('_', '/')}."
            + (" Refunded." if refunded else ""),
            sms_type='Transactional'
        )

        return jsonify({
            'message': 'Order cancelled' + (' and refunded' if refunded else ''),
            'refunded': refunded
        }), 200
    except Exception:
        logger.exception("Failed to cancel order %s", exchange_id)
        return jsonify({'message': 'Failed to cancel order'}), 500


@orders_bp.route('/<int:exchange_id>/reschedule', methods=['POST'])
@jwt_required()
def reschedule_order(exchange_id):
    """Reschedule a scheduled/ready order to a new future date."""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    new_date = data.get('date')

    if not new_date:
        return jsonify({'message': 'New date is required'}), 400

    from datetime import datetime
    parts = new_date.split('_')
    if len(parts) != 3:
        return jsonify({'message': 'Invalid date format'}), 400
    try:
        new_pickup = datetime(int(parts[2]), int(parts[0]), int(parts[1]))
    except ValueError:
        return jsonify({'message': 'Invalid date'}), 400

    if new_pickup.date() < datetime.now().date():
        return jsonify({'message': 'New date must be in the future'}), 400

    order = Database.execute_query(
        """SELECT e.exchange_id, e.customer_id, e.date, e.num_cans, e.can_type,
                  COALESCE(e.status, 'scheduled') as status
           FROM exchanges e
           WHERE e.exchange_id = %s""",
        (exchange_id,),
        fetch_one=True
    )

    if not order:
        return jsonify({'message': 'Order not found'}), 404
    if int(order['customer_id']) != int(user_id):
        return jsonify({'message': 'Not your order'}), 403
    if order['status'] not in ('scheduled', 'ready'):
        return jsonify({'message': f'Order cannot be rescheduled (status: {order["status"]})'}), 400

    # Capacity check on the new date for the same cylinder type
    try:
        booked = Database.execute_query(
            """SELECT COALESCE(SUM(num_cans), 0) as total FROM exchanges
               WHERE date = %s AND can_type = %s AND exchange_id != %s""",
            (new_date, order['can_type'], exchange_id),
            fetch_one=True
        )
        booked_total = int(booked['total'] or 0)
        max_qty = QUICK_CONNECT_MAX if order['can_type'] == QUICK_CONNECT else SCREW_IN_MAX
        if booked_total + int(order['num_cans']) > max_qty:
            return jsonify({'message': f'No availability on {new_date.replace("_", "/")} for this cylinder type'}), 400
    except Exception:
        logger.exception("Error checking availability for reschedule")
        return jsonify({'message': 'Failed to check availability'}), 500

    try:
        old_date = order['date']
        Database.execute_update(
            "UPDATE exchanges SET date=%s WHERE exchange_id=%s",
            (new_date, exchange_id)
        )

        sms_service.send_sms(
            '4038897632',
            f"SodaKid: Order #{exchange_id} RESCHEDULED by customer from "
            f"{old_date.replace('_', '/')} to {new_date.replace('_', '/')} "
            f"({order['num_cans']} {order['can_type']}).",
            sms_type='Transactional'
        )

        return jsonify({'message': 'Order rescheduled', 'date': new_date}), 200
    except Exception:
        logger.exception("Failed to reschedule order %s", exchange_id)
        return jsonify({'message': 'Failed to reschedule order'}), 500


@orders_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_order():
    """Return the order details for a completed Stripe checkout session."""
    user_id = get_jwt_identity()
    session_id = request.args.get('session_id')

    if not session_id:
        return jsonify({'message': 'session_id is required'}), 400

    order = Database.execute_query(
        """SELECT e.exchange_id, e.customer_id, e.date, e.time, e.num_cans,
                  e.can_type, COALESCE(e.status, 'scheduled') as status,
                  p.amount_paid, p.stripe_session_id
           FROM exchanges e
           JOIN payments p ON e.exchange_id = p.exchange_id
           WHERE p.stripe_session_id = %s""",
        (session_id,),
        fetch_one=True
    )

    if not order:
        return jsonify({'message': 'Order not found'}), 404
    if int(order['customer_id']) != int(user_id):
        return jsonify({'message': 'Not your order'}), 403

    return jsonify({
        'exchangeId': order['exchange_id'],
        'date': order['date'],
        'time': order['time'],
        'numCans': order['num_cans'],
        'canType': order['can_type'],
        'status': order['status'],
        'amountPaid': order['amount_paid']
    }), 200
