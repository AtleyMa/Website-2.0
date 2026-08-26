# AWS Services (SNS for SMS)
import logging
import os

import boto3
from dotenv import load_dotenv

from constants import QUICK_CONNECT

logger = logging.getLogger(__name__)

load_dotenv(dotenv_path='config.env')


class SMSService:
    """Service for sending SMS messages via AWS SNS"""
    
    def __init__(self):
        self.client = boto3.client(
            'sns',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION')
        )
    
    def send_sms(self, phone_number: str, message: str) -> bool:
        """Send an SMS message to the specified phone number"""
        try:
            # Ensure phone number has country code
            if not phone_number.startswith('+'):
                phone_number = f'+1{phone_number}'
            
            self.client.publish(
                PhoneNumber=phone_number,
                Message=message
            )
            return True
        except Exception:
            logger.exception("SMS error sending to %s", phone_number)
            return False
    
    def send_verification_code(self, phone: str, code: str, purpose: str = 'verification') -> bool:
        """Send a verification code via SMS"""
        if purpose == 'password-reset':
            message = f"SodaKid Password Reset Verification Code: {code}"
        else:
            message = f"SodaKid Account Creation Verification Code: {code}"
        
        return self.send_sms(phone, message)
    
    def send_order_confirmation(self, phone: str, order_date: str, can_type: str) -> bool:
        """Send order confirmation SMS"""
        if can_type == QUICK_CONNECT:
            instructions = 'in the mailbox to the right of the door.'
        else:
            instructions = 'in the brown box to the right of the door.'
        
        message = (
            f"SodaKid Exchange Confirmation:\n"
            f"Instructions: Please arrive at 2005 29 Ave SW Calgary during your "
            f"scheduled day on {order_date} and refer to the instructions {instructions}\n"
            f"Thank you!\nSodaKid"
        )
        
        return self.send_sms(phone, message)


# Singleton instance
sms_service = SMSService()
