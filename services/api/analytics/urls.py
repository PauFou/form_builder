from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('events/', views.track_event, name='track_event'),
    path('events/batch/', views.track_events_batch, name='track_events_batch'),
    path('forms/<uuid:form_id>/', views.get_form_analytics, name='form_analytics'),
    path('forms/<uuid:form_id>/funnel/', views.get_form_funnel, name='form_funnel'),
    path('forms/<uuid:form_id>/realtime/', views.get_form_realtime, name='form_realtime'),
    path('forms/<uuid:form_id>/questions/', views.get_form_questions_performance, name='form_questions'),
]