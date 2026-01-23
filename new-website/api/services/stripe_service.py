# Stripe Payment Service
import stripe
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='config.env')

# Initialize Stripe with production key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

DOMAIN = os.getenv('DOMAIN', 'https://sodakid.ca')

# Price IDs from environment
BLUE_PRICE_ID = os.getenv('STRIPE_BLUE_PRICE_ID')
PINK_PRICE_ID = os.getenv('STRIPE_PINK_PRICE_ID')


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
        quantity: int,
        time_slot: str,
        date: str
    ) -> dict:
        """Create a Stripe Checkout Session"""
        try:
            # Use the same Price IDs as the original project
            if can_type == "Blue (Original)":
                price_id = BLUE_PRICE_ID
            else:
                price_id = PINK_PRICE_ID
            
            session = stripe.checkout.Session.create(
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
                success_url=f'{DOMAIN}/success?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{DOMAIN}/cancel',
            )
            
            return {
                'session_id': session.id,
                'checkoutUrl': session.url
            }
        except stripe.error.StripeError as e:
            print(f"Stripe Error creating checkout session: {e}")
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
