# Contact Routes
from flask import Blueprint, request, jsonify
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Database
from services.sms import sms_service

contact_bp = Blueprint('contact', __name__)


@contact_bp.route('/contact', methods=['POST'])
def submit_contact():
    """Submit a contact form message"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['firstName', 'lastName', 'phone', 'message']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    try:
        # Store message in database
        Database.execute_insert(
            "INSERT INTO messages (f_name, l_name, phone, message) VALUES (%s, %s, %s, %s)",
            (
                data['firstName'],
                data['lastName'],
                data['phone'],
                data['message']
            )
        )
        
        # Send notification to admin
        admin_message = (
            f"FROM: {data['firstName']} {data['lastName']}\n"
            f"PHONE: {data['phone']}\n"
            f"{data['message']}"
        )
        
        # Send to admin phone (configured in environment)
        import os
        admin_phone = os.getenv('ADMIN_PHONE', '4038897632')
        sms_service.send_sms(admin_phone, admin_message)
        
        # Log the sent message
        Database.execute_insert(
            "INSERT INTO message_sent (message_content, phone) VALUES (%s, %s)",
            (admin_message, admin_phone)
        )
        
        return jsonify({'message': 'Message sent successfully'}), 201
        
    except Exception as e:
        print(f"Contact form error: {e}")
        return jsonify({'message': 'Failed to send message'}), 500
