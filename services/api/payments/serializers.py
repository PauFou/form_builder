from rest_framework import serializers
from decimal import Decimal


class CreatePaymentIntentSerializer(serializers.Serializer):
    """Serializer for creating payment intents"""
    
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.50'))
    currency = serializers.CharField(max_length=3, default='USD')
    description = serializers.CharField(max_length=500, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    coupon = serializers.CharField(max_length=50, required=False, allow_blank=True)
    form_id = serializers.UUIDField(required=False)
    submission_id = serializers.UUIDField(required=False)
    metadata = serializers.JSONField(required=False, default=dict)
    
    def validate_currency(self, value):
        """Validate currency code"""
        valid_currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'SEK', 'NOK']
        if value.upper() not in valid_currencies:
            raise serializers.ValidationError(f"Currency must be one of: {', '.join(valid_currencies)}")
        return value.upper()
    
    def validate_amount(self, value):
        """Validate amount is reasonable"""
        if value > 999999.99:
            raise serializers.ValidationError("Amount cannot exceed 999,999.99")
        return value


class ValidateCouponSerializer(serializers.Serializer):
    """Serializer for validating coupons"""
    
    code = serializers.CharField(max_length=50)
    
    def validate_code(self, value):
        """Clean coupon code"""
        return value.strip().upper()


class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for payment intent details"""
    
    id = serializers.CharField()
    status = serializers.CharField()
    amount = serializers.IntegerField()
    currency = serializers.CharField()
    created = serializers.IntegerField()
    metadata = serializers.JSONField()
    charge = serializers.JSONField(required=False)
    payment_method = serializers.JSONField(required=False)


class RefundSerializer(serializers.Serializer):
    """Serializer for creating refunds"""
    
    amount = serializers.IntegerField(required=False, min_value=1, help_text="Amount in cents")
    reason = serializers.ChoiceField(
        choices=[
            ('duplicate', 'Duplicate'),
            ('fraudulent', 'Fraudulent'),
            ('requested_by_customer', 'Requested by customer'),
        ],
        default='requested_by_customer'
    )
    
    def validate_amount(self, value):
        """Validate refund amount"""
        if value and value > 999999 * 100:  # Max $999,999
            raise serializers.ValidationError("Refund amount too large")
        return value


class StripeWebhookSerializer(serializers.Serializer):
    """Serializer for Stripe webhook events"""
    
    id = serializers.CharField()
    object = serializers.CharField()
    api_version = serializers.CharField(required=False)
    created = serializers.IntegerField()
    data = serializers.JSONField()
    livemode = serializers.BooleanField()
    pending_webhooks = serializers.IntegerField()
    request = serializers.JSONField(required=False)
    type = serializers.CharField()