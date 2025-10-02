"""
Stripe payment integration service
"""
import stripe
import logging
from decimal import Decimal
from typing import Dict, Any, Optional, Tuple, List
from django.conf import settings

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
stripe.api_version = '2023-10-16'


class StripeService:
    """Handle Stripe payment operations"""
    
    def __init__(self):
        self.stripe = stripe
        
    def create_payment_intent(
        self,
        amount: Decimal,
        currency: str = 'USD',
        description: str = None,
        metadata: Dict[str, Any] = None,
        customer_email: str = None,
        coupon_code: str = None,
        form_id: str = None,
        submission_id: str = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe payment intent
        
        Args:
            amount: Amount in the currency's smallest unit (e.g., cents for USD)
            currency: Three-letter ISO currency code
            description: Payment description
            metadata: Additional metadata to attach
            customer_email: Customer email for receipt
            coupon_code: Coupon code to apply
            form_id: Associated form ID
            submission_id: Associated submission ID
            
        Returns:
            Dict containing client_secret and intent_id
        """
        try:
            # Ensure amount is an integer (smallest currency unit)
            amount_cents = int(amount * 100)
            
            # Prepare metadata
            payment_metadata = {
                'source': 'forms_platform',
                'form_id': form_id or '',
                'submission_id': submission_id or '',
            }
            if metadata:
                payment_metadata.update(metadata)
                
            # Create payment intent
            intent_params = {
                'amount': amount_cents,
                'currency': currency.lower(),
                'description': description or 'Payment for form submission',
                'metadata': payment_metadata,
                'automatic_payment_methods': {
                    'enabled': True,
                },
            }
            
            # Add customer email if provided
            if customer_email:
                intent_params['receipt_email'] = customer_email
                
            # Apply coupon if provided
            if coupon_code:
                # Validate and apply coupon
                discount = self.validate_coupon(coupon_code)
                if discount:
                    discounted_amount = amount_cents * (1 - discount['percent_off'] / 100)
                    intent_params['amount'] = int(discounted_amount)
                    payment_metadata['coupon_code'] = coupon_code
                    payment_metadata['discount_percent'] = discount['percent_off']
                    
            intent = stripe.PaymentIntent.create(**intent_params)
            
            return {
                'client_secret': intent.client_secret,
                'intent_id': intent.id,
                'amount': intent.amount,
                'currency': intent.currency,
                'status': intent.status,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {str(e)}")
            raise PaymentError(f"Payment processing error: {str(e)}")
        except Exception as e:
            logger.exception("Unexpected error creating payment intent")
            raise PaymentError(f"Unexpected payment error: {str(e)}")
    
    def validate_coupon(self, coupon_code: str) -> Optional[Dict[str, Any]]:
        """
        Validate a Stripe coupon code
        
        Args:
            coupon_code: The coupon code to validate
            
        Returns:
            Coupon details if valid, None otherwise
        """
        try:
            coupon = stripe.Coupon.retrieve(coupon_code)
            
            # Check if coupon is valid
            if not coupon.valid:
                return None
                
            # Check if coupon has redemption limit
            if coupon.max_redemptions and coupon.times_redeemed >= coupon.max_redemptions:
                return None
                
            return {
                'id': coupon.id,
                'percent_off': coupon.percent_off,
                'amount_off': coupon.amount_off,
                'currency': coupon.currency,
                'valid': coupon.valid,
            }
            
        except stripe.error.InvalidRequestError:
            # Coupon doesn't exist
            return None
        except Exception as e:
            logger.error(f"Error validating coupon {coupon_code}: {str(e)}")
            return None
    
    def confirm_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """
        Confirm a payment intent (for server-side confirmation)
        
        Args:
            payment_intent_id: The payment intent ID
            
        Returns:
            Payment intent details
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if intent.status == 'requires_confirmation':
                intent = stripe.PaymentIntent.confirm(payment_intent_id)
                
            return {
                'id': intent.id,
                'status': intent.status,
                'amount': intent.amount,
                'currency': intent.currency,
                'payment_method': intent.payment_method,
                'receipt_email': intent.receipt_email,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment: {str(e)}")
            raise PaymentError(f"Payment confirmation error: {str(e)}")
    
    def retrieve_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """
        Retrieve payment intent details
        
        Args:
            payment_intent_id: The payment intent ID
            
        Returns:
            Payment intent details
        """
        try:
            intent = stripe.PaymentIntent.retrieve(
                payment_intent_id,
                expand=['payment_method', 'latest_charge']
            )
            
            result = {
                'id': intent.id,
                'status': intent.status,
                'amount': intent.amount,
                'currency': intent.currency,
                'created': intent.created,
                'metadata': intent.metadata,
            }
            
            # Add charge details if available
            if intent.latest_charge:
                charge = intent.latest_charge
                result['charge'] = {
                    'id': charge.id,
                    'amount': charge.amount,
                    'currency': charge.currency,
                    'paid': charge.paid,
                    'refunded': charge.refunded,
                    'receipt_url': charge.receipt_url,
                }
                
            # Add payment method details if available
            if intent.payment_method:
                pm = intent.payment_method
                result['payment_method'] = {
                    'id': pm.id,
                    'type': pm.type,
                    'card': {
                        'brand': pm.card.brand,
                        'last4': pm.card.last4,
                        'exp_month': pm.card.exp_month,
                        'exp_year': pm.card.exp_year,
                    } if pm.type == 'card' else None
                }
                
            return result
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error retrieving payment: {str(e)}")
            raise PaymentError(f"Payment retrieval error: {str(e)}")
    
    def create_refund(
        self,
        payment_intent_id: str,
        amount: Optional[int] = None,
        reason: str = 'requested_by_customer',
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Create a refund for a payment
        
        Args:
            payment_intent_id: The payment intent ID
            amount: Amount to refund in cents (None for full refund)
            reason: Refund reason
            metadata: Additional metadata
            
        Returns:
            Refund details
        """
        try:
            refund_params = {
                'payment_intent': payment_intent_id,
                'reason': reason,
            }
            
            if amount is not None:
                refund_params['amount'] = amount
                
            if metadata:
                refund_params['metadata'] = metadata
                
            refund = stripe.Refund.create(**refund_params)
            
            return {
                'id': refund.id,
                'amount': refund.amount,
                'currency': refund.currency,
                'status': refund.status,
                'reason': refund.reason,
                'created': refund.created,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {str(e)}")
            raise PaymentError(f"Refund error: {str(e)}")
    
    def handle_webhook(self, payload: bytes, signature: str) -> Tuple[str, Dict[str, Any]]:
        """
        Handle Stripe webhook events
        
        Args:
            payload: Raw webhook payload
            signature: Stripe signature header
            
        Returns:
            Tuple of (event_type, event_data)
        """
        try:
            # Verify webhook signature
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET
            )
            
            # Extract relevant data based on event type
            event_type = event.type
            event_data = event.data.object
            
            # Log important events
            important_events = [
                'payment_intent.succeeded',
                'payment_intent.payment_failed',
                'charge.refunded',
                'charge.dispute.created',
            ]
            
            if event_type in important_events:
                logger.info(f"Stripe webhook received: {event_type} for {event_data.get('id')}")
                
            return event_type, event_data
            
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid Stripe webhook signature: {str(e)}")
            raise PaymentError("Invalid webhook signature")
        except Exception as e:
            logger.exception("Error processing Stripe webhook")
            raise PaymentError(f"Webhook processing error: {str(e)}")
    
    def list_payments(
        self,
        form_id: Optional[str] = None,
        limit: int = 100,
        starting_after: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List payment intents with optional filtering
        
        Args:
            form_id: Filter by form ID in metadata
            limit: Number of results to return
            starting_after: Pagination cursor
            
        Returns:
            List of payment details
        """
        try:
            params = {
                'limit': min(limit, 100),
            }
            
            if starting_after:
                params['starting_after'] = starting_after
                
            if form_id:
                # Filter by metadata (Note: Stripe doesn't support direct metadata filtering)
                # We need to fetch all and filter client-side
                params['limit'] = 100
                
            intents = stripe.PaymentIntent.list(**params)
            
            results = []
            for intent in intents.data:
                # Filter by form_id if specified
                if form_id and intent.metadata.get('form_id') != form_id:
                    continue
                    
                results.append({
                    'id': intent.id,
                    'amount': intent.amount,
                    'currency': intent.currency,
                    'status': intent.status,
                    'created': intent.created,
                    'metadata': intent.metadata,
                })
                
            return results
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error listing payments: {str(e)}")
            raise PaymentError(f"Payment listing error: {str(e)}")


class PaymentError(Exception):
    """Custom exception for payment errors"""
    pass