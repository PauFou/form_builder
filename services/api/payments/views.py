from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
import logging

from .stripe_service import StripeService, PaymentError
from .serializers import (
    CreatePaymentIntentSerializer,
    ValidateCouponSerializer,
    PaymentIntentSerializer,
    RefundSerializer
)
from forms.models import Form
from core.models import Submission
from webhooks.delivery import trigger_webhook_for_submission

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow anonymous payments
def create_payment_intent(request):
    """Create a Stripe payment intent"""
    serializer = CreatePaymentIntentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    data = serializer.validated_data
    
    # Get form if provided
    form = None
    if data.get('form_id'):
        try:
            form = Form.objects.get(id=data['form_id'])
        except Form.DoesNotExist:
            return Response(
                {'error': 'Form not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    try:
        service = StripeService()
        result = service.create_payment_intent(
            amount=data['amount'],
            currency=data.get('currency', 'USD'),
            description=data.get('description'),
            metadata=data.get('metadata', {}),
            customer_email=data.get('email'),
            coupon_code=data.get('coupon'),
            form_id=str(form.id) if form else None,
            submission_id=data.get('submission_id')
        )
        
        return Response(result, status=status.HTTP_201_CREATED)
        
    except PaymentError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_coupon(request):
    """Validate a Stripe coupon code"""
    serializer = ValidateCouponSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    service = StripeService()
    coupon = service.validate_coupon(serializer.validated_data['code'])
    
    if not coupon:
        return Response(
            {'valid': False, 'error': 'Invalid coupon code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({
        'valid': True,
        'coupon': coupon
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_payment_intent(request, intent_id):
    """Retrieve payment intent details"""
    try:
        service = StripeService()
        result = service.retrieve_payment(intent_id)
        
        serializer = PaymentIntentSerializer(result)
        return Response(serializer.data)
        
    except PaymentError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_refund(request, intent_id):
    """Create a refund for a payment"""
    serializer = RefundSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    try:
        # Verify user has permission to refund
        # This would need to check if the user owns the form/submission
        service = StripeService()
        payment = service.retrieve_payment(intent_id)
        
        # Check if user has permission (simplified - you'd want more checks)
        form_id = payment.get('metadata', {}).get('form_id')
        if form_id:
            try:
                form = Form.objects.get(id=form_id)
                if form.organization not in request.user.organizations.all():
                    return Response(
                        {'error': 'Permission denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Form.DoesNotExist:
                pass
        
        # Create refund
        result = service.create_refund(
            intent_id,
            amount=serializer.validated_data.get('amount'),
            reason=serializer.validated_data.get('reason', 'requested_by_customer'),
            metadata={'refunded_by': str(request.user.id)}
        )
        
        return Response(result, status=status.HTTP_201_CREATED)
        
    except PaymentError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    if not sig_header:
        return Response(
            {'error': 'Missing signature'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        service = StripeService()
        event_type, event_data = service.handle_webhook(payload, sig_header)
        
        # Handle specific events
        if event_type == 'payment_intent.succeeded':
            handle_payment_success(event_data)
        elif event_type == 'payment_intent.payment_failed':
            handle_payment_failure(event_data)
        elif event_type == 'charge.refunded':
            handle_refund(event_data)
            
        return Response({'received': True})
        
    except PaymentError as e:
        logger.error(f"Stripe webhook error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


def handle_payment_success(payment_intent):
    """Handle successful payment"""
    logger.info(f"Payment succeeded: {payment_intent['id']}")
    
    # Update submission if linked
    submission_id = payment_intent.get('metadata', {}).get('submission_id')
    if submission_id:
        try:
            submission = Submission.objects.get(id=submission_id)
            
            # Update submission data with payment info
            if not submission.data:
                submission.data = {}
                
            submission.data['payment'] = {
                'status': 'succeeded',
                'payment_intent_id': payment_intent['id'],
                'amount': payment_intent['amount'],
                'currency': payment_intent['currency'],
                'paid_at': payment_intent['created'],
            }
            
            # Add receipt URL if available
            if 'latest_charge' in payment_intent and payment_intent['latest_charge']:
                charge = payment_intent['latest_charge']
                if isinstance(charge, dict) and 'receipt_url' in charge:
                    submission.data['payment']['receipt_url'] = charge['receipt_url']
                    
            submission.save()
            
            # Trigger webhooks for payment completion
            trigger_webhook_for_submission(submission)
            
        except Submission.DoesNotExist:
            logger.error(f"Submission {submission_id} not found for payment")


def handle_payment_failure(payment_intent):
    """Handle failed payment"""
    logger.warning(f"Payment failed: {payment_intent['id']}")
    
    # Update submission if linked
    submission_id = payment_intent.get('metadata', {}).get('submission_id')
    if submission_id:
        try:
            submission = Submission.objects.get(id=submission_id)
            
            if not submission.data:
                submission.data = {}
                
            submission.data['payment'] = {
                'status': 'failed',
                'payment_intent_id': payment_intent['id'],
                'error': payment_intent.get('last_payment_error', {}).get('message', 'Payment failed'),
            }
            submission.save()
            
        except Submission.DoesNotExist:
            logger.error(f"Submission {submission_id} not found for failed payment")


def handle_refund(charge):
    """Handle refund event"""
    logger.info(f"Refund processed for charge: {charge['id']}")
    
    # Update submission if linked
    payment_intent_id = charge.get('payment_intent')
    if payment_intent_id:
        try:
            service = StripeService()
            payment = service.retrieve_payment(payment_intent_id)
            
            submission_id = payment.get('metadata', {}).get('submission_id')
            if submission_id:
                submission = Submission.objects.get(id=submission_id)
                
                if not submission.data:
                    submission.data = {}
                    
                submission.data['payment'] = {
                    'status': 'refunded',
                    'payment_intent_id': payment_intent_id,
                    'refunded_at': charge['created'],
                    'refund_amount': charge.get('amount_refunded', 0),
                }
                submission.save()
                
        except Exception as e:
            logger.error(f"Error handling refund: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_payments(request):
    """List payments for a form"""
    form_id = request.query_params.get('form_id')
    
    if not form_id:
        return Response(
            {'error': 'form_id parameter required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify user has access to form
    try:
        form = Form.objects.get(id=form_id)
        if form.organization not in request.user.organizations.all():
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
    except Form.DoesNotExist:
        return Response(
            {'error': 'Form not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        service = StripeService()
        payments = service.list_payments(
            form_id=form_id,
            limit=int(request.query_params.get('limit', 50)),
            starting_after=request.query_params.get('starting_after')
        )
        
        return Response({
            'payments': payments,
            'has_more': len(payments) == int(request.query_params.get('limit', 50))
        })
        
    except PaymentError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )