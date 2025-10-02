from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Payment intent endpoints
    path('create-intent/', views.create_payment_intent, name='create_intent'),
    path('validate-coupon/', views.validate_coupon, name='validate_coupon'),
    path('intent/<str:intent_id>/', views.get_payment_intent, name='get_intent'),
    path('intent/<str:intent_id>/refund/', views.create_refund, name='create_refund'),
    
    # List payments
    path('list/', views.list_payments, name='list_payments'),
    
    # Stripe webhook
    path('stripe/webhook/', views.stripe_webhook, name='stripe_webhook'),
]