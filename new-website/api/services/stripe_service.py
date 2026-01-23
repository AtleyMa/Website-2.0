# Stripe Payment Service
# Following Stripe Checkout Quickstart: https://docs.stripe.com/checkout/quickstart
import stripe
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.env'))

# Set Stripe API key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Domain for redirects
DOMAIN = os.getenv('DOMAIN', 'https://sodakid.ca')


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
        """Create a Stripe Checkout Session following quickstart guide"""
        try:
            # Product name based on can type
            if can_type == "Blue (Original)":
                product_name = "Blue (Original) CO2 Canister Exchange"
            else:
                product_name = "Pink (Terra) CO2 Canister Exchange"
            
            # Create checkout session - simple quickstart approach
            session = stripe.checkout.Session.create(
                line_items=[{
                    'price_data': {
                        'currency': 'cad',
                        'product_data': {
                            'name': product_name,
                        },
                        'unit_amount': 1000,  # $10.00 in cents
                    },
                    'quantity': int(quantity),
                }],
                mode='payment',
                success_url=DOMAIN + '/success',
                cancel_url=DOMAIN + '/place-order',
            )
            
            return {
                'checkoutUrl': session.url
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
