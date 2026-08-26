# Authentication Routes
import hmac
import logging
import os
import secrets
import time

import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)

from database import Database
from rate_limit import rate_limit
from services.sms import sms_service
from services.stripe_service import stripe_service

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

# In-memory store for verification codes (use Redis in production)
verification_codes = {}

# In-memory store for OAuth state (CSRF protection) and one-time login codes
oauth_states = set()
oauth_login_codes = {}

# Verification code lifetime (seconds)
VERIFICATION_CODE_TTL = 600


def _new_verification_code():
    """Generate a cryptographically secure 4-digit verification code."""
    return str(secrets.randbelow(9000) + 1000)


def _is_expired(stored):
    return time.time() > stored.get('expires', 0)


@auth_bp.route('/signup', methods=['POST'])
@rate_limit(5, 300)
def signup():
    """Begin the signup process"""
    data = request.get_json(silent=True) or {}
    
    # Validate required fields
    required_fields = ['firstName', 'lastName', 'email', 'phone', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    # Check if email already exists
    existing_user = Database.execute_query(
        "SELECT customer_id FROM customers WHERE email = %s",
        (data['email'],),
        fetch_one=True
    )
    
    if existing_user:
        return jsonify({'message': 'This email is already registered'}), 409
    
    # Generate verification code
    code = _new_verification_code()
    
    # Store verification data temporarily
    verification_codes[data['phone']] = {
        'code': code,
        'type': 'signup',
        'data': data,
        'expires': time.time() + VERIFICATION_CODE_TTL
    }
    
    # Send verification SMS
    sms_service.send_verification_code(data['phone'], code, 'signup')
    
    return jsonify({
        'message': 'Verification code sent',
        'phone': data['phone']
    }), 200


@auth_bp.route('/verify-account', methods=['POST'])
@rate_limit(10, 300)
def verify_account():
    """Verify account with SMS code and complete registration"""
    data = request.get_json(silent=True) or {}
    code = data.get('code')
    phone = data.get('phone')
    
    if not phone or phone not in verification_codes:
        return jsonify({'message': 'Invalid verification session'}), 400
    
    stored = verification_codes[phone]
    
    if _is_expired(stored):
        del verification_codes[phone]
        return jsonify({'message': 'Verification code expired'}), 400
    
    if stored['code'] != code:
        return jsonify({'message': 'Invalid verification code'}), 400
    
    if stored['type'] != 'signup':
        return jsonify({'message': 'Invalid verification type'}), 400
    
    user_data = stored['data']
    
    try:
        # Create Stripe customer
        stripe_id = stripe_service.create_customer(
            f"{user_data['firstName']} {user_data['lastName']}",
            user_data['email']
        )
        
        # Hash the password
        password_hash = bcrypt.hashpw(
            user_data['password'].encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Insert user into database
        customer_id = Database.execute_insert(
            """INSERT INTO customers 
               (f_name, l_name, phone, email, password, stripe_id) 
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                user_data['firstName'],
                user_data['lastName'],
                user_data['phone'],
                user_data['email'],
                password_hash,
                stripe_id
            )
        )
        
        # Clean up verification code
        del verification_codes[phone]
        
        # Create JWT token
        token = create_access_token(identity=str(customer_id))
        
        return jsonify({
            'token': token,
            'user': {
                'id': customer_id,
                'firstName': user_data['firstName'],
                'lastName': user_data['lastName'],
                'email': user_data['email'],
                'phone': user_data['phone']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'message': 'Failed to create account'}), 500


@auth_bp.route('/login', methods=['POST'])
@rate_limit(10, 60)
def login():
    """Login with email and password"""
    data = request.get_json(silent=True) or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
    
    user = Database.execute_query(
        "SELECT * FROM customers WHERE email = %s",
        (email,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'message': 'Invalid email or password'}), 401
    
    # Verify password (bcrypt hashes, or legacy plain-text during migration)
    stored_password = user['password'] or ''
    if stored_password.startswith('$2'):
        if not bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
            return jsonify({'message': 'Invalid email or password'}), 401
    else:
        # Legacy plain-text password (migration only) - constant-time comparison
        if not hmac.compare_digest(stored_password.encode('utf-8'), password.encode('utf-8')):
            return jsonify({'message': 'Invalid email or password'}), 401
    
    # Create JWT token
    token = create_access_token(identity=str(user['customer_id']))
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['customer_id'],
            'firstName': user['f_name'],
            'lastName': user['l_name'],
            'email': user['email'],
            'phone': user['phone'],
            'stripeId': user['stripe_id']
        }
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    user_id = get_jwt_identity()
    
    user = Database.execute_query(
        "SELECT * FROM customers WHERE customer_id = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'user': {
            'id': user['customer_id'],
            'firstName': user['f_name'],
            'lastName': user['l_name'],
            'email': user['email'],
            'phone': user['phone'],
            'stripeId': user['stripe_id']
        }
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
@rate_limit(5, 300)
def forgot_password():
    """Initiate password reset"""
    data = request.get_json(silent=True) or {}
    phone = data.get('phone')
    
    if not phone:
        return jsonify({'message': 'Phone number is required'}), 400
    
    # Check if user exists
    user = Database.execute_query(
        "SELECT customer_id FROM customers WHERE phone = %s",
        (phone,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'message': 'No account found with this phone number'}), 404
    
    # Generate verification code
    code = _new_verification_code()
    
    # Store verification data
    verification_codes[phone] = {
        'code': code,
        'type': 'password-reset',
        'user_id': user['customer_id'],
        'expires': time.time() + VERIFICATION_CODE_TTL
    }
    
    # Send verification SMS
    sms_service.send_verification_code(phone, code, 'password-reset')
    
    return jsonify({'message': 'Verification code sent'}), 200


@auth_bp.route('/verify-phone', methods=['POST'])
@rate_limit(10, 300)
def verify_phone():
    """Verify phone for password reset"""
    data = request.get_json(silent=True) or {}
    code = data.get('code')
    phone = data.get('phone')
    
    if not phone or phone not in verification_codes:
        return jsonify({'message': 'Invalid verification session'}), 400
    
    stored = verification_codes[phone]
    
    if _is_expired(stored):
        del verification_codes[phone]
        return jsonify({'message': 'Verification code expired'}), 400
    
    if stored['code'] != code:
        return jsonify({'message': 'Invalid verification code'}), 400
    
    # Mark as verified
    verification_codes[phone]['verified'] = True
    
    # Generate reset token
    reset_token = str(secrets.randbelow(900000) + 100000)
    verification_codes[phone]['reset_token'] = reset_token
    
    return jsonify({
        'message': 'Phone verified',
        'resetToken': reset_token
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
@rate_limit(10, 300)
def reset_password():
    """Reset password with verified token"""
    data = request.get_json(silent=True) or {}
    phone = data.get('phone')
    reset_token = data.get('resetToken')
    new_password = data.get('password')
    
    if not phone or phone not in verification_codes:
        return jsonify({'message': 'Invalid reset session'}), 400
    
    stored = verification_codes[phone]
    
    if _is_expired(stored):
        del verification_codes[phone]
        return jsonify({'message': 'Reset session expired'}), 400
    
    if not stored.get('verified') or stored.get('reset_token') != reset_token:
        return jsonify({'message': 'Invalid reset token'}), 400
    
    # Hash the new password
    password_hash = bcrypt.hashpw(
        new_password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')
    
    # Update password
    Database.execute_update(
        "UPDATE customers SET password = %s WHERE phone = %s",
        (password_hash, phone)
    )
    
    # Clean up
    del verification_codes[phone]
    
    return jsonify({'message': 'Password reset successfully'}), 200


@auth_bp.route('/resend-signup-code', methods=['POST'])
@auth_bp.route('/resend-reset-code', methods=['POST'])
@rate_limit(5, 300)
def resend_code():
    """Resend verification code"""
    data = request.get_json(silent=True) or {}
    phone = data.get('phone')
    
    if not phone or phone not in verification_codes:
        return jsonify({'message': 'Invalid session'}), 400
    
    stored = verification_codes[phone]
    
    # Generate new code
    code = _new_verification_code()
    verification_codes[phone]['code'] = code
    verification_codes[phone]['expires'] = time.time() + VERIFICATION_CODE_TTL
    
    # Send new code
    purpose = stored.get('type', 'verification')
    sms_service.send_verification_code(phone, code, purpose)
    
    return jsonify({'message': 'Verification code resent'}), 200


# Google OAuth Routes
@auth_bp.route('/google', methods=['GET'])
def google_login():
    """Redirect to Google OAuth"""
    from urllib.parse import urlencode
    from flask import redirect
    
    google_client_id = os.getenv('GOOGLE_CLIENT_ID')
    redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    if not google_client_id:
        # Redirect to login page with error instead of JSON
        return redirect(f'{frontend_url}/login?error=google_not_configured')
    
    # Generate a state value to prevent CSRF
    state = secrets.token_urlsafe(32)
    oauth_states.add(state)
    
    params = {
        'client_id': google_client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state
    }
    
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return redirect(google_auth_url)


@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    import requests
    from flask import redirect
    
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    code = request.args.get('code')
    error = request.args.get('error')
    state = request.args.get('state')
    
    if error:
        return redirect(f'{frontend_url}/login?error={error}')
    
    # Validate state to prevent CSRF
    if not state or state not in oauth_states:
        return redirect(f'{frontend_url}/login?error=invalid_state')
    oauth_states.discard(state)
    
    if not code:
        return redirect(f'{frontend_url}/login?error=no_code')
    
    google_client_id = os.getenv('GOOGLE_CLIENT_ID')
    google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')
    
    # Exchange code for tokens
    token_response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'client_id': google_client_id,
            'client_secret': google_client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        },
        timeout=10
    )
    
    if token_response.status_code != 200:
        return redirect(f'{frontend_url}/login?error=token_exchange_failed')
    
    tokens = token_response.json()
    access_token = tokens.get('access_token')
    
    # Get user info from Google
    user_info_response = requests.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        headers={'Authorization': f'Bearer {access_token}'},
        timeout=10
    )
    
    if user_info_response.status_code != 200:
        return redirect(f'{frontend_url}/login?error=user_info_failed')
    
    google_user = user_info_response.json()
    
    # Only trust verified emails
    if not google_user.get('email_verified'):
        return redirect(f'{frontend_url}/login?error=email_not_verified')
    
    email = google_user.get('email')
    first_name = google_user.get('given_name', '')
    last_name = google_user.get('family_name', '')
    
    try:
        # Check if user exists
        existing_user = Database.execute_query(
            "SELECT customer_id, f_name FROM customers WHERE email = %s",
            (email,),
            fetch_one=True
        )
        
        if existing_user:
            user_id = existing_user['customer_id']
            display_name = existing_user['f_name']
            is_new = False
        else:
            # Create new user with Stripe (password left empty; cannot log in with password)
            stripe_id = stripe_service.create_customer(
                f'{first_name} {last_name}',
                email
            )
            
            user_id = Database.execute_insert(
                """INSERT INTO customers 
                   (f_name, l_name, email, phone, password, stripe_id) 
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (first_name, last_name, email, '', '', stripe_id)
            )
            display_name = first_name
            is_new = True
        
        # Issue a short-lived, one-time login code instead of exposing the JWT in the URL
        login_code = secrets.token_urlsafe(32)
        oauth_login_codes[login_code] = str(user_id)
        
        new_param = '&new=true' if is_new else ''
        return redirect(f'{frontend_url}/login?code={login_code}&user={display_name}{new_param}')
    except Exception:
        logger.exception("Google OAuth DB error")
        return redirect(f'{frontend_url}/login?error=database_error')


@auth_bp.route('/oauth-token', methods=['POST'])
@rate_limit(10, 60)
def oauth_token():
    """Exchange a one-time OAuth login code for a JWT"""
    data = request.get_json(silent=True) or {}
    login_code = data.get('code')
    
    if not login_code or login_code not in oauth_login_codes:
        return jsonify({'message': 'Invalid or expired login code'}), 400
    
    user_id = oauth_login_codes.pop(login_code)
    
    user = Database.execute_query(
        """SELECT customer_id, f_name, l_name, email, phone, stripe_id 
           FROM customers WHERE customer_id = %s""",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    token = create_access_token(identity=str(user['customer_id']))
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['customer_id'],
            'firstName': user['f_name'],
            'lastName': user['l_name'],
            'email': user['email'],
            'phone': user['phone'],
            'stripeId': user['stripe_id']
        }
    }), 200
