from django.contrib import admin
from django.utils.html import format_html
from .models import Webhook, Delivery, DeadLetterQueue, WebhookLog


@admin.register(Webhook)
class WebhookAdmin(admin.ModelAdmin):
    list_display = [
        'url', 'organization', 'active', 'include_partials',
        'success_rate_display', 'total_deliveries', 'created_at'
    ]
    list_filter = ['active', 'include_partials', 'created_at']
    search_fields = ['url', 'organization__name']
    readonly_fields = [
        'secret', 'total_deliveries', 'successful_deliveries',
        'failed_deliveries', 'success_rate'
    ]
    
    def success_rate_display(self, obj):
        if obj.total_deliveries == 0:
            return "N/A"
        rate = obj.success_rate
        color = 'green' if rate >= 90 else 'orange' if rate >= 70 else 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, rate
        )
    success_rate_display.short_description = 'Success Rate'


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'webhook', 'status_display', 'attempt',
        'response_code', 'response_time_ms', 'created_at'
    ]
    list_filter = ['status', 'response_code', 'created_at']
    search_fields = ['id', 'webhook__url', 'error']
    readonly_fields = [
        'webhook', 'submission', 'partial', 'payload_size',
        'response_time_ms', 'delivered_at'
    ]
    
    def status_display(self, obj):
        colors = {
            'pending': 'blue',
            'processing': 'orange',
            'success': 'green',
            'failed': 'red',
            'dlq': 'darkred'
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_display.short_description = 'Status'
    
    actions = ['retry_failed_deliveries']
    
    def retry_failed_deliveries(self, request, queryset):
        from .tasks import retry_webhook_delivery
        count = 0
        for delivery in queryset.filter(status__in=['failed', 'dlq']):
            retry_webhook_delivery.delay(delivery.id)
            count += 1
        self.message_user(request, f'Queued {count} deliveries for retry')
    retry_failed_deliveries.short_description = 'Retry failed deliveries'


@admin.register(DeadLetterQueue)
class DeadLetterQueueAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'delivery', 'reason', 'created_at', 'redriven_at'
    ]
    list_filter = ['created_at', 'redriven_at']
    search_fields = ['delivery__id', 'reason']
    readonly_fields = ['delivery', 'payload_json']
    
    actions = ['redrive_selected']
    
    def redrive_selected(self, request, queryset):
        from .tasks import redrive_dlq_entry
        count = 0
        for dlq in queryset.filter(redriven_at__isnull=True):
            redrive_dlq_entry.delay(dlq.id)
            count += 1
        self.message_user(request, f'Queued {count} DLQ entries for redrive')
    redrive_selected.short_description = 'Redrive selected entries'


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = [
        'delivery', 'attempt', 'response_status', 'duration_ms', 'timestamp'
    ]
    list_filter = ['response_status', 'timestamp']
    search_fields = ['delivery__id', 'error_message']
    readonly_fields = [
        'delivery', 'request_headers', 'request_body',
        'response_headers', 'response_body', 'error_message'
    ]
    
    def has_add_permission(self, request):
        return False