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
    
    # Get exchanges for the month
    date_pattern = f"{month}_%_{year}"
    
    exchanges = Database.execute_query(
        """SELECT date, num_cans, can_type FROM exchanges 
           WHERE date LIKE %s ORDER BY date""",
        (date_pattern,)
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
            date=date
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
