# Stripe Payment Service
import logging
import os

import stripe
from dotenv import load_dotenv

from constants import QUICK_CONNECT

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.env'))

# Set Stripe API key (use test key in development when available)
is_production = os.getenv('FLASK_ENV', 'development') == 'production'
stripe.api_key = os.getenv('STRIPE_SECRET_KEY') if is_production else os.getenv('STRIPE_TEST_SECRET_KEY', os.getenv('STRIPE_SECRET_KEY'))

# Domain for redirects
DOMAIN = os.getenv('DOMAIN', 'https://sodakid.ca')
if not is_production:
    DOMAIN = os.getenv('FRONTEND_URL', 'http://localhost:3000')


class StripeService:
    """Service for handling Stripe payments"""
    
    @staticmethod
    def create_customer(name: str, email: str) -> str:
        """Create a new Stripe customer and return the customer ID"""
        try:
            customer = stripe.Customer.create(
                name=name,
                email=email
            )
            return customer.id
        except stripe.StripeError:
            logger.exception("Stripe error creating customer")
            raise
    
    @staticmethod
    def create_checkout_session(
        stripe_customer_id: str,
        can_type: str,
        quantity,
        date: str
    ) -> dict:
        """Create a Stripe Checkout Session using pre-created Price IDs"""
        try:
            # Use pre-created Price IDs
            if is_production:
                price_id = 'price_1OZOilJn3PNSsZghHeUuOAwR' if can_type == QUICK_CONNECT else 'price_1OZOhtJn3PNSsZghJesSah6t'
            else:
                price_id = os.getenv('STRIPE_TEST_PRICE_ID', 'price_1OZOORJn3PNSsZghOj5X64uz')
            
            session = stripe.checkout.Session.create(
                customer=stripe_customer_id,
                line_items=[
                    {
                        'price': price_id,
                        'quantity': int(quantity),
                    }
                ],
                mode='payment',
                success_url=DOMAIN + '/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=DOMAIN + '/place-order',
            )
            
            return {
                'checkoutUrl': session.url
            }
        except Exception:
            logger.exception("Stripe error creating checkout session")
            raise
    
    @staticmethod
    def retrieve_session(session_id: str) -> dict:
        """Retrieve a Stripe Checkout Session"""
        try:
            return stripe.checkout.Session.retrieve(session_id)
        except stripe.StripeError:
            logger.exception("Stripe error retrieving session")
            raise


# Singleton instance
stripe_service = StripeService()
