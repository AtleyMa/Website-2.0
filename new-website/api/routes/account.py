# Account Routes
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Database

account_bp = Blueprint('account', __name__)


@account_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile information"""
    user_id = get_jwt_identity()
    
    user = Database.execute_query(
        "SELECT * FROM customers WHERE customer_id = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'profile': {
            'id': user['customer_id'],
            'firstName': user['f_name'],
            'lastName': user['l_name'],
            'email': user['email'],
            'phone': user['phone']
        }
    }), 200


@account_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile information"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Build update query dynamically
    updates = []
    params = []
    
    if data.get('firstName'):
        updates.append('f_name = %s')
        params.append(data['firstName'])
    
    if data.get('lastName'):
        updates.append('l_name = %s')
        params.append(data['lastName'])
    
    if data.get('email'):
        updates.append('email = %s')
        params.append(data['email'])
    
    if data.get('phone'):
        updates.append('phone = %s')
        params.append(data['phone'])
    
    if not updates:
        return jsonify({'message': 'No updates provided'}), 400
    
    params.append(user_id)
    
    try:
        Database.execute_update(
            f"UPDATE customers SET {', '.join(updates)} WHERE customer_id = %s",
            tuple(params)
        )
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to update profile'}), 500


@account_bp.route('/exchanges', methods=['GET'])
@jwt_required()
def get_exchanges():
    """Get user's exchange history"""
    user_id = get_jwt_identity()
    
    exchanges = Database.execute_query(
        """SELECT date, time, num_cans, can_type 
           FROM exchanges 
           WHERE customer_id = %s 
           ORDER BY exchange_id DESC""",
        (user_id,)
    )
    
    return jsonify({'exchanges': exchanges}), 200
