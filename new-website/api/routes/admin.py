# Admin Routes - Secure dashboard endpoints
from flask import Blueprint, request, jsonify
import os
import secrets
import hashlib
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Database

admin_bp = Blueprint('admin', __name__)

# Simple token storage (in production, use Redis or database)
admin_tokens = set()

# Admin password from environment variable
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'SodaKid2024!')


def hash_password(password):
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_admin_token(token):
    """Verify the admin token is valid"""
    return token in admin_tokens


def require_admin(f):
    """Decorator to require admin authentication"""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-Admin-Token')
        if not token or not verify_admin_token(token):
            return jsonify({'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    data = request.get_json()
    password = data.get('password', '')
    
    if password == ADMIN_PASSWORD:
        # Generate a secure token
        token = secrets.token_urlsafe(32)
        admin_tokens.add(token)
        return jsonify({
            'success': True,
            'token': token,
            'message': 'Login successful'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Invalid password'
        }), 401


@admin_bp.route('/logout', methods=['POST'])
@require_admin
def admin_logout():
    """Admin logout endpoint"""
    token = request.headers.get('X-Admin-Token')
    admin_tokens.discard(token)
    return jsonify({'message': 'Logged out successfully'}), 200


@admin_bp.route('/customers', methods=['GET'])
@require_admin
def get_customers():
    """Get all customers"""
    try:
        customers = Database.execute_query(
            """SELECT customer_id, f_name, l_name, phone, email, password, 
                      created_at, stripe_id 
               FROM customers 
               ORDER BY created_at DESC""",
            fetch_all=True
        )
        return jsonify({'customers': customers or []}), 200
    except Exception as e:
        print(f"Error fetching customers: {e}")
        return jsonify({'customers': [], 'error': str(e)}), 200


@admin_bp.route('/exchanges', methods=['GET'])
@require_admin
def get_exchanges():
    """Get all exchanges/orders"""
    try:
        exchanges = Database.execute_query(
            """SELECT exchange_id, customer_id, datetime, exchange_date, 
                      exchange_time, quantity, canister_type 
               FROM exchanges 
               ORDER BY datetime DESC""",
            fetch_all=True
        )
        return jsonify({'exchanges': exchanges or []}), 200
    except Exception as e:
        print(f"Error fetching exchanges: {e}")
        return jsonify({'exchanges': [], 'error': str(e)}), 200


@admin_bp.route('/messages', methods=['GET'])
@require_admin
def get_messages():
    """Get all contact messages"""
    try:
        messages = Database.execute_query(
            """SELECT message_id, datetime, f_name, l_name, phone, message 
               FROM messages 
               ORDER BY datetime DESC""",
            fetch_all=True
        )
        return jsonify({'messages': messages or []}), 200
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return jsonify({'messages': [], 'error': str(e)}), 200


@admin_bp.route('/sent-messages', methods=['GET'])
@require_admin
def get_sent_messages():
    """Get all sent SMS messages"""
    try:
        sent = Database.execute_query(
            """SELECT id, datetime, content, phone 
               FROM sent_messages 
               ORDER BY datetime DESC""",
            fetch_all=True
        )
        return jsonify({'sentMessages': sent or []}), 200
    except Exception as e:
        print(f"Error fetching sent messages: {e}")
        return jsonify({'sentMessages': [], 'error': str(e)}), 200


@admin_bp.route('/stats', methods=['GET'])
@require_admin
def get_stats():
    """Get dashboard statistics"""
    try:
        # Total customers
        customer_count = Database.execute_query(
            "SELECT COUNT(*) as count FROM customers",
            fetch_one=True
        )
        
        # Total exchanges
        exchange_count = Database.execute_query(
            "SELECT COUNT(*) as count FROM exchanges",
            fetch_one=True
        )
        
        # Total revenue (assuming $10 per canister)
        revenue = Database.execute_query(
            "SELECT COALESCE(SUM(quantity), 0) * 10 as total FROM exchanges",
            fetch_one=True
        )
        
        # Pending exchanges (future dates)
        pending = Database.execute_query(
            "SELECT COUNT(*) as count FROM exchanges WHERE exchange_date >= CURDATE()",
            fetch_one=True
        )
        
        return jsonify({
            'totalCustomers': customer_count['count'] if customer_count else 0,
            'totalExchanges': exchange_count['count'] if exchange_count else 0,
            'totalRevenue': revenue['total'] if revenue else 0,
            'pendingExchanges': pending['count'] if pending else 0
        }), 200
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return jsonify({
            'totalCustomers': 0,
            'totalExchanges': 0,
            'totalRevenue': 0,
            'pendingExchanges': 0,
            'error': str(e)
        }), 200
