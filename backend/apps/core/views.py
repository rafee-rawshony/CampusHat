from django.http import JsonResponse
from django.db import connection

def health_check(request):
    """
    Basic health check for the API.
    Verifies database connectivity.
    """
    health_status = {
        "status": "healthy",
        "services": {
            "database": "online",
            "api": "online"
        }
    }
    
    try:
        connection.ensure_connection()
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["services"]["database"] = f"error: {str(e)}"
        
    return JsonResponse(health_status)
