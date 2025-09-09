from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import redis
from django.conf import settings
import time


def health_check(request):
    """Health check endpoint for monitoring"""
    start_time = time.time()
    
    checks = {
        'status': 'healthy',
        'checks': {}
    }
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['checks']['database'] = {'status': 'healthy'}
    except Exception as e:
        checks['checks']['database'] = {'status': 'unhealthy', 'error': str(e)}
        checks['status'] = 'unhealthy'
    
    # Redis check
    try:
        redis_client = redis.from_url(settings.CELERY_BROKER_URL)
        redis_client.ping()
        checks['checks']['redis'] = {'status': 'healthy'}
    except Exception as e:
        checks['checks']['redis'] = {'status': 'unhealthy', 'error': str(e)}
        checks['status'] = 'unhealthy'
    
    # Response time
    checks['response_time_ms'] = round((time.time() - start_time) * 1000, 2)
    
    status_code = 200 if checks['status'] == 'healthy' else 503
    return JsonResponse(checks, status=status_code)


def ready_check(request):
    """Readiness check for Kubernetes"""
    try:
        # Check if migrations are applied
        from django.db.migrations.executor import MigrationExecutor
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if plan:
            return JsonResponse({'status': 'not_ready', 'reason': 'migrations_pending'}, status=503)
        
        return JsonResponse({'status': 'ready'})
    except Exception as e:
        return JsonResponse({'status': 'not_ready', 'error': str(e)}, status=503)