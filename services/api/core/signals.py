from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Organization, Membership, Form, FormVersion, AuditLog

User = get_user_model()


def create_audit_log(organization, actor, action, entity, entity_id, diff=None):
    """Helper to create audit log entries"""
    AuditLog.objects.create(
        organization=organization,
        actor=actor,
        action=action,
        entity=entity,
        entity_id=str(entity_id),
        diff_json=diff
    )


@receiver(post_save, sender=Organization)
def handle_organization_created(sender, instance, created, **kwargs):
    if created:
        # Create owner membership for the creator
        if hasattr(instance, '_created_by'):
            Membership.objects.create(
                user=instance._created_by,
                organization=instance,
                role='owner'
            )
            create_audit_log(
                instance,
                instance._created_by,
                'created',
                'organization',
                instance.id
            )


@receiver(post_save, sender=Form)
def handle_form_saved(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    actor = getattr(instance, '_current_user', None)
    
    if actor:
        diff = None
        if not created and hasattr(instance, '_original_values'):
            diff = {
                field: {
                    'old': instance._original_values.get(field),
                    'new': getattr(instance, field)
                }
                for field in ['title', 'status', 'slug']
                if instance._original_values.get(field) != getattr(instance, field)
            }
        
        create_audit_log(
            instance.organization,
            actor,
            action,
            'form',
            instance.id,
            diff
        )


@receiver(pre_save, sender=Form)
def capture_form_original_values(sender, instance, **kwargs):
    if instance.pk:
        original = Form.objects.filter(pk=instance.pk).first()
        if original:
            instance._original_values = {
                'title': original.title,
                'status': original.status,
                'slug': original.slug
            }


@receiver(post_save, sender=FormVersion)
def handle_form_version_created(sender, instance, created, **kwargs):
    if created:
        actor = getattr(instance, '_current_user', None)
        if actor:
            create_audit_log(
                instance.form.organization,
                actor,
                'published' if instance.published_at else 'created',
                'form_version',
                instance.id,
                {'version': instance.version}
            )


@receiver(post_save, sender=Membership)
def handle_membership_changed(sender, instance, created, **kwargs):
    action = 'member_added' if created else 'member_updated'
    actor = getattr(instance, '_current_user', None)
    
    if actor:
        create_audit_log(
            instance.organization,
            actor,
            action,
            'membership',
            instance.id,
            {
                'user': instance.user.email,
                'role': instance.role
            }
        )


@receiver(post_delete, sender=Membership)
def handle_membership_deleted(sender, instance, **kwargs):
    actor = getattr(instance, '_current_user', None)
    
    if actor:
        create_audit_log(
            instance.organization,
            actor,
            'member_removed',
            'membership',
            instance.id,
            {
                'user': instance.user.email,
                'role': instance.role
            }
        )