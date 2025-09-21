import stripe
from typing import Dict, Any, List
from django.conf import settings

from .base import BaseProvider


class StripeProvider(BaseProvider):
    """Stripe payment integration provider"""
    
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
    
    def test_connection(self, integration, sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test Stripe connection"""
        
        try:
            # Test API key by fetching account info
            account = stripe.Account.retrieve()
            return {
                'account_id': account.id,
                'business_name': account.settings.dashboard.display_name,
                'country': account.country
            }
        except stripe.error.AuthenticationError:
            raise ValueError("Invalid Stripe API key")
        except Exception as e:
            raise ValueError(f"Failed to connect to Stripe: {str(e)}")
    
    def send_data(self, integration, data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment through Stripe"""
        
        # This is a simplified example - in production, you'd handle this differently
        # typically through Stripe Elements or Payment Links
        
        # Get payment amount and currency
        amount = settings.get('amount')
        if not amount:
            raise ValueError("Payment amount is required")
        
        currency = settings.get('currency', 'usd')
        
        # Create customer
        customer_email = data.get('email')
        if customer_email:
            customer = stripe.Customer.create(
                email=customer_email,
                metadata={
                    'form_submission_id': data.get('_metadata', {}).get('submission_id', '')
                }
            )
            customer_id = customer.id
        else:
            customer_id = None
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to cents
            currency=currency,
            customer=customer_id,
            metadata={
                'form_submission_id': data.get('_metadata', {}).get('submission_id', ''),
                'form_id': data.get('_metadata', {}).get('form_id', ''),
            }
        )
        
        return {
            'payment_intent_id': intent.id,
            'client_secret': intent.client_secret,
            'amount': intent.amount,
            'currency': intent.currency,
            'status': intent.status
        }
    
    def get_available_fields(self, integration) -> List[Dict[str, Any]]:
        """Get Stripe-specific fields"""
        return [
            {'id': 'email', 'name': 'Customer Email', 'type': 'email'},
            {'id': 'name', 'name': 'Customer Name', 'type': 'string'},
            {'id': 'amount', 'name': 'Payment Amount', 'type': 'number'},
            {'id': 'currency', 'name': 'Currency', 'type': 'string'},
        ]