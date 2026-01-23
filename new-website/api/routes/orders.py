# Orders Routes
from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Database
from services.stripe_service import stripe_service
from services.sms import sms_service

orders_bp = Blueprint('orders', __name__)


@orders_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_availability():
    """Get canister availability for a given month"""
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    if not month or not year:
        return jsonify({'message': 'Month and year are required'}), 400
    
    # Get exchanges for the month
    date_pattern = f"{month}_%_{year}"
    
    blue_exchanges = Database.execute_query(
        """SELECT date, time, num_cans FROM exchanges 
           WHERE date LIKE %s AND can_type = %s ORDER BY date""",
        (date_pattern, 'Blue (Original)')
    )
    
    pink_exchanges = Database.execute_query(
        """SELECT date, time, num_cans FROM exchanges 
           WHERE date LIKE %s AND can_type = %s ORDER BY date""",
        (date_pattern, 'Pink (Terra)')
    )
    
    # Calculate availability by day
    availability = {
        'blue': {'morning': {}, 'evening': {}},
        'pink': {'morning': {}, 'evening': {}}
    }
    
    for exchange in blue_exchanges:
        day = exchange['date'].split('_')[1]
        time_key = 'morning' if exchange['time'] == 'a' else 'evening'
        availability['blue'][time_key][day] = availability['blue'][time_key].get(day, 0) + exchange['num_cans']
    
    for exchange in pink_exchanges:
        day = exchange['date'].split('_')[1]
        time_key = 'morning' if exchange['time'] == 'a' else 'evening'
        availability['pink'][time_key][day] = availability['pink'][time_key].get(day, 0) + exchange['num_cans']
    
    return jsonify(availability), 200


@orders_bp.route('/canister-type', methods=['POST'])
@jwt_required()
def set_canister_type():
    """Set the canister type for the order"""
    data = request.get_json()
    can_type = data.get('canType')
    
    if can_type not in ['Blue (Original)', 'Pink (Terra)']:
        return jsonify({'message': 'Invalid canister type'}), 400
    
    # Store in session or return confirmation
    session['can_type'] = can_type
    
    return jsonify({'message': 'Canister type set', 'canType': can_type}), 200


@orders_bp.route('/quantity', methods=['POST'])
@jwt_required()
def set_quantity():
    """Set the quantity for the order"""
    data = request.get_json()
    quantity = data.get('quantity', type=int)
    
    if not quantity or quantity < 1:
        return jsonify({'message': 'Invalid quantity'}), 400
    
    # Validate against max limits
    can_type = session.get('can_type', 'Blue (Original)')
    max_qty = 4 if can_type == 'Pink (Terra)' else 12
    
    if quantity > max_qty:
        return jsonify({'message': f'Maximum {max_qty} canisters allowed'}), 400
    
    session['quantity'] = quantity
    
    return jsonify({'message': 'Quantity set', 'quantity': quantity}), 200


@orders_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout():
    """Create a Stripe checkout session"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Get order details
    can_type = data.get('canisterType') or session.get('can_type')
    quantity = data.get('quantity') or session.get('quantity')
    time_slot = data.get('time')
    date = data.get('date')
    
    if not all([can_type, quantity, time_slot, date]):
        return jsonify({'message': 'Missing order details'}), 400
    
    # Get user's Stripe ID
    user = Database.execute_query(
        "SELECT stripe_id, phone FROM customers WHERE customer_id = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user or not user['stripe_id']:
        return jsonify({'message': 'User not found or Stripe not configured'}), 400
    
    # Store order details in session for success callback
    session['pending_order'] = {
        'customer_id': user_id,
        'can_type': can_type,
        'quantity': quantity,
        'time': time_slot,
        'date': date,
        'phone': user['phone']
    }
    
    try:
        # Create Stripe checkout session
        checkout = stripe_service.create_checkout_session(
            stripe_customer_id=user['stripe_id'],
            can_type=can_type,
            quantity=quantity,
            time_slot=time_slot,
            date=date
        )
        
        return jsonify(checkout), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@orders_bp.route('/confirm', methods=['POST'])
@jwt_required()
def confirm_order():
    """Confirm and record the order after successful payment"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
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
                order['time'],
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
            order['time'],
            order['can_type']
        )
        
        # Clear pending order
        session.pop('pending_order', None)
        
        return jsonify({
            'message': 'Order confirmed',
            'exchangeId': exchange_id
        }), 201
        
    except Exception as e:
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
