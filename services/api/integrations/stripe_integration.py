"""
Stripe Payment Integration

Handles:
- Payment block configuration
- Checkout session creation
- Webhook handling
- Payment status tracking
"""

import logging
from typing import Dict, Optional, Any
import stripe
from django.conf import settings
from django.db import transaction

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')


class StripeIntegration:
    """Stripe payment integration"""

    def __init__(self):
        self.api_key = stripe.api_key
        self.webhook_secret = STRIPE_WEBHOOK_SECRET

    def create_checkout_session(
        self,
        amount: int,
        currency: str = "usd",
        description: str = "",
        metadata: Optional[Dict[str, Any]] = None,
        success_url: str = "",
        cancel_url: str = "",
        customer_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout session

        Args:
            amount: Amount in cents (e.g., 1000 = $10.00)
            currency: Currency code (e.g., "usd", "eur")
            description: Payment description
            metadata: Custom metadata to attach to payment
            success_url: Redirect URL after successful payment
            cancel_url: Redirect URL after cancelled payment
            customer_email: Pre-fill customer email

        Returns:
            Dict with session details including checkout URL
        """
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': currency,
                        'product_data': {
                            'name': description or 'Form Submission Payment',
                        },
                        'unit_amount': amount,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                metadata=metadata or {},
            )

            return {
                'success': True,
                'session_id': session.id,
                'checkout_url': session.url,
                'amount': amount,
                'currency': currency
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe checkout session creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def create_payment_intent(
        self,
        amount: int,
        currency: str = "usd",
        description: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a Payment Intent for custom checkout flow

        Args:
            amount: Amount in cents
            currency: Currency code
            description: Payment description
            metadata: Custom metadata

        Returns:
            Dict with PaymentIntent details including client_secret
        """
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                description=description,
                metadata=metadata or {},
            )

            return {
                'success': True,
                'payment_intent_id': intent.id,
                'client_secret': intent.client_secret,
                'amount': amount,
                'currency': currency
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe PaymentIntent creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> Optional[Dict[str, Any]]:
        """
        Verify Stripe webhook signature

        Args:
            payload: Raw request body
            signature: Stripe-Signature header value

        Returns:
            Parsed event dict if valid, None otherwise
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            return event

        except ValueError:
            logger.error("Invalid Stripe webhook payload")
            return None

        except stripe.error.SignatureVerificationError:
            logger.error("Invalid Stripe webhook signature")
            return None

    def handle_webhook_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle Stripe webhook events

        Supported events:
        - checkout.session.completed
        - payment_intent.succeeded
        - payment_intent.payment_failed
        - charge.refunded

        Args:
            event: Stripe webhook event

        Returns:
            Dict with processing result
        """
        event_type = event['type']
        data = event['data']['object']

        handlers = {
            'checkout.session.completed': self._handle_checkout_completed,
            'payment_intent.succeeded': self._handle_payment_succeeded,
            'payment_intent.payment_failed': self._handle_payment_failed,
            'charge.refunded': self._handle_charge_refunded,
        }

        handler = handlers.get(event_type)
        if handler:
            return handler(data)
        else:
            logger.info(f"Unhandled Stripe event: {event_type}")
            return {'success': True, 'message': 'Event received but not processed'}

    def _handle_checkout_completed(self, session: Dict) -> Dict[str, Any]:
        """Handle successful checkout session completion"""
        try:
            # Extract metadata
            metadata = session.get('metadata', {})
            form_id = metadata.get('form_id')
            submission_id = metadata.get('submission_id')

            if submission_id:
                # Import here to avoid circular dependency
                from submissions.models import Submission

                # Update submission with payment info
                submission = Submission.objects.get(id=submission_id)
                submission.metadata = submission.metadata or {}
                submission.metadata['payment'] = {
                    'status': 'paid',
                    'stripe_session_id': session['id'],
                    'amount': session['amount_total'],
                    'currency': session['currency'],
                    'payment_status': session['payment_status']
                }
                submission.save()

                logger.info(f"Payment completed for submission {submission_id}")

            return {
                'success': True,
                'message': 'Checkout session completed',
                'submission_id': submission_id
            }

        except Exception as e:
            logger.error(f"Error handling checkout completion: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def _handle_payment_succeeded(self, payment_intent: Dict) -> Dict[str, Any]:
        """Handle successful payment intent"""
        logger.info(f"Payment succeeded: {payment_intent['id']}")
        return {'success': True, 'message': 'Payment succeeded'}

    def _handle_payment_failed(self, payment_intent: Dict) -> Dict[str, Any]:
        """Handle failed payment intent"""
        logger.warning(f"Payment failed: {payment_intent['id']}")
        return {'success': True, 'message': 'Payment failed notification received'}

    def _handle_charge_refunded(self, charge: Dict) -> Dict[str, Any]:
        """Handle charge refund"""
        logger.info(f"Charge refunded: {charge['id']}")
        return {'success': True, 'message': 'Refund processed'}

    def get_payment_status(self, session_id: str) -> Dict[str, Any]:
        """
        Get payment status from Stripe session

        Args:
            session_id: Stripe checkout session ID

        Returns:
            Dict with payment status details
        """
        try:
            session = stripe.checkout.Session.retrieve(session_id)

            return {
                'success': True,
                'payment_status': session.payment_status,
                'status': session.status,
                'amount': session.amount_total,
                'currency': session.currency
            }

        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve payment status: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def create_refund(
        self,
        payment_intent_id: str,
        amount: Optional[int] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a refund

        Args:
            payment_intent_id: Payment Intent ID to refund
            amount: Amount to refund in cents (None = full refund)
            reason: Refund reason

        Returns:
            Dict with refund details
        """
        try:
            refund_params = {'payment_intent': payment_intent_id}

            if amount:
                refund_params['amount'] = amount
            if reason:
                refund_params['reason'] = reason

            refund = stripe.Refund.create(**refund_params)

            return {
                'success': True,
                'refund_id': refund.id,
                'amount': refund.amount,
                'status': refund.status
            }

        except stripe.error.StripeError as e:
            logger.error(f"Refund creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def validate_payment_block(self, block_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate payment block configuration

        Args:
            block_config: Payment block configuration

        Returns:
            Validation result
        """
        errors = []

        # Required fields
        required = ['amount', 'currency']
        for field in required:
            if field not in block_config:
                errors.append(f"Missing required field: {field}")

        # Validate amount
        amount = block_config.get('amount')
        if amount and (not isinstance(amount, int) or amount < 50):
            errors.append("Amount must be at least 50 cents")

        # Validate currency
        currency = block_config.get('currency')
        supported_currencies = ['usd', 'eur', 'gbp', 'cad', 'aud']
        if currency and currency.lower() not in supported_currencies:
            errors.append(f"Currency must be one of: {', '.join(supported_currencies)}")

        if errors:
            return {
                'valid': False,
                'errors': errors
            }

        return {
            'valid': True,
            'message': 'Payment block configuration is valid'
        }


# Singleton instance
stripe_integration = StripeIntegration()
