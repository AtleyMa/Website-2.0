# Stripe Payment Service
# Using exact same setup as the original working project
import stripe
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.env'))

# Price IDs from env - same as original project
TERRA_PRICE_ID = os.getenv('STRIPE_PINK_PRICE_ID', 'price_1OZOilJn3PNSsZghHeUuOAwR')
OG_PRICE_ID = os.getenv('STRIPE_BLUE_PRICE_ID', 'price_1OZOhtJn3PNSsZghJesSah6t')

# Domain from env
DOMAIN = os.getenv('DOMAIN', 'https://sodakid.ca')

# Initialize Stripe with key from env
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


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
        except stripe.error.StripeError as e:
            print(f"Stripe Error creating customer: {e}")
            raise
    
    @staticmethod
    def create_checkout_session(
        stripe_customer_id: str,
        can_type: str,
        quantity,
        time_slot: str,
        date: str
    ) -> dict:
        """Create a Stripe Checkout Session - exact same as original project"""
        try:
            # Same logic as original app.py
            if can_type == "Blue (Original)":
                price_id = OG_PRICE_ID
            else:
                price_id = TERRA_PRICE_ID
            
            # Exact same checkout session creation as original
            checkout_session = stripe.checkout.Session.create(
                customer=stripe_customer_id,
                submit_type='pay',
                billing_address_collection='auto',
                line_items=[
                    {
                        'price': price_id,
                        'quantity': quantity,
                    },
                ],
                mode='payment',
                success_url=DOMAIN + '/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=DOMAIN + '/place-order',
            )
            
            return {
                'session_id': checkout_session.id,
                'checkoutUrl': checkout_session.url
            }
        except Exception as e:
            print(f"Stripe Error: {e}")
            raise
    
    @staticmethod
    def retrieve_session(session_id: str) -> dict:
        """Retrieve a Stripe Checkout Session"""
        try:
            return stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError as e:
            print(f"Stripe Error retrieving session: {e}")
            raise


# Singleton instance
stripe_service = StripeService()
