"""
Analytics API views - Proxy to ClickHouse analytics service
"""
import httpx
from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Membership
from forms.models import Form

ANALYTICS_SERVICE_URL = getattr(settings, 'ANALYTICS_SERVICE_URL', 'http://localhost:8002')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_event(request):
    """Track analytics event - proxy to analytics service"""
    try:
        # Validate organization access
        form_id = request.data.get('form_id')
        if form_id:
            try:
                form = Form.objects.select_related('organization').get(id=form_id)
            except (Form.DoesNotExist, ValueError, ValidationError):
                return Response(
                    {"error": "Form not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            if not Membership.objects.filter(
                organization=form.organization,
                user=request.user
            ).exists():
                return Response(
                    {"error": "Permission denied"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Add organization_id to event data
            request.data['organization_id'] = str(form.organization.id)
        
        # Forward to analytics service
        with httpx.Client() as client:
            response = client.post(
                f"{ANALYTICS_SERVICE_URL}/events",
                json=request.data,
                timeout=5.0
            )
            return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_events_batch(request):
    """Track multiple events - proxy to analytics service"""
    try:
        # Validate all events have valid form access
        events = request.data.get('events', [])
        form_ids = {event.get('form_id') for event in events if event.get('form_id')}
        
        # Check access to all forms
        forms = Form.objects.filter(id__in=form_ids).select_related('organization')
        form_org_map = {str(form.id): form.organization for form in forms}
        
        # Validate user has access to all organizations
        user_orgs = set(
            Membership.objects.filter(user=request.user)
            .values_list('organization_id', flat=True)
        )
        
        for event in events:
            form_id = event.get('form_id')
            if form_id and str(form_id) in form_org_map:
                org = form_org_map[str(form_id)]
                if org.id not in user_orgs:
                    return Response(
                        {"error": f"Permission denied for form {form_id}"},
                        status=status.HTTP_403_FORBIDDEN
                    )
                event['organization_id'] = str(org.id)
        
        # Forward to analytics service
        with httpx.Client() as client:
            response = client.post(
                f"{ANALYTICS_SERVICE_URL}/events/batch",
                json={"events": events},
                timeout=10.0
            )
            return Response(response.json(), status=response.status_code)
            
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_form_analytics(request, form_id):
    """Get analytics for a form"""
    try:
        # Validate access
        form = Form.objects.select_related('organization').get(id=form_id)
        if not Membership.objects.filter(
            organization=form.organization,
            user=request.user
        ).exists():
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Parse date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Forward to analytics service
        params = {
            'organization_id': str(form.organization.id),
        }
        if start_date:
            params['start_date'] = start_date
        if end_date:
            params['end_date'] = end_date
            
        with httpx.Client() as client:
            response = client.get(
                f"{ANALYTICS_SERVICE_URL}/analytics/form/{form_id}",
                params=params,
                timeout=10.0
            )
            return Response(response.json(), status=response.status_code)
            
    except Form.DoesNotExist:
        return Response(
            {"error": "Form not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_form_funnel(request, form_id):
    """Get funnel analytics for a form"""
    try:
        # Validate access
        form = Form.objects.select_related('organization').get(id=form_id)
        if not Membership.objects.filter(
            organization=form.organization,
            user=request.user
        ).exists():
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Parse date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Forward to analytics service
        params = {
            'organization_id': str(form.organization.id),
        }
        if start_date:
            params['start_date'] = start_date
        if end_date:
            params['end_date'] = end_date
            
        with httpx.Client() as client:
            response = client.get(
                f"{ANALYTICS_SERVICE_URL}/analytics/funnel/{form_id}",
                params=params,
                timeout=10.0
            )
            return Response(response.json(), status=response.status_code)
            
    except Form.DoesNotExist:
        return Response(
            {"error": "Form not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_form_realtime(request, form_id):
    """Get real-time analytics for a form"""
    try:
        # Validate access
        form = Form.objects.select_related('organization').get(id=form_id)
        if not Membership.objects.filter(
            organization=form.organization,
            user=request.user
        ).exists():
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Forward to analytics service
        with httpx.Client() as client:
            response = client.get(
                f"{ANALYTICS_SERVICE_URL}/analytics/realtime/{form_id}",
                timeout=5.0
            )
            return Response(response.json(), status=response.status_code)
            
    except Form.DoesNotExist:
        return Response(
            {"error": "Form not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_form_questions_performance(request, form_id):
    """Get question-level performance analytics"""
    try:
        # Validate access
        form = Form.objects.select_related('organization').get(id=form_id)
        if not Membership.objects.filter(
            organization=form.organization,
            user=request.user
        ).exists():
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get form schema to map questions
        version = form.published_version or form.draft_version
        if not version:
            return Response(
                {"error": "No form version found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Build question map from schema
        questions = []
        for page in version.schema_json.get('pages', []):
            for block in page.get('blocks', []):
                if block.get('type') != 'text':  # Skip text blocks
                    questions.append({
                        'id': block.get('id'),
                        'question': block.get('label', block.get('content', 'Untitled')),
                        'type': block.get('type'),
                        'required': block.get('required', False)
                    })
        
        # Get analytics data from ClickHouse service
        params = {
            'organization_id': str(form.organization.id),
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date')
        }
        
        with httpx.Client() as client:
            # Get step-level analytics
            response = client.get(
                f"{ANALYTICS_SERVICE_URL}/analytics/form/{form_id}",
                params=params,
                timeout=10.0
            )
            
            if response.status_code != 200:
                return Response(response.json(), status=response.status_code)
            
            analytics_data = response.json()
            
            # For now, return mock data with real structure
            # In production, this would query ClickHouse for field-level stats
            question_stats = []
            for idx, q in enumerate(questions):
                # Calculate mock stats based on completion rate
                base_rate = analytics_data.get('completion_rate', 0.78)
                variance = 0.05 * (idx % 3 - 1)  # Add some variance
                response_rate = min(1.0, max(0, base_rate + variance))
                
                total_views = analytics_data.get('starts', 450)
                answered = int(total_views * response_rate)
                skipped = total_views - answered
                
                question_stats.append({
                    'question_id': q['id'],
                    'question': q['question'],
                    'type': q['type'],
                    'required': q['required'],
                    'answered': answered,
                    'skipped': skipped,
                    'response_rate': response_rate * 100,
                    'avg_time_seconds': 12 + (idx * 3)  # Mock increasing time
                })
            
            return Response({
                'form_id': form_id,
                'period': analytics_data.get('period'),
                'questions': question_stats
            })
            
    except Form.DoesNotExist:
        return Response(
            {"error": "Form not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )