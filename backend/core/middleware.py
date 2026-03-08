"""
CampusHat Middleware.

ActivityLogMiddleware — logs mutating API actions for security/compliance.
"""

import logging
import re

logger = logging.getLogger(__name__)

# Paths to SKIP logging (high-frequency, low-value)
SKIP_PATHS = [
    '/api/v1/auth/token/refresh/',
    '/api/v1/cart/',
    '/api/schema/',
    '/api/docs/',
    '/api/redoc/',
]

# Paths to ALWAYS log (important actions)
ALWAYS_LOG_PATHS = [
    '/api/v1/orders/checkout/',
    '/api/v1/admin/',
]


class ActivityLogMiddleware:
    """
    Logs key API actions to ActivityLog.

    Only logs mutating requests (POST, PATCH, PUT, DELETE)
    that return a success status code (< 400).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.method in ('POST', 'PATCH', 'PUT', 'DELETE'):
            if response.status_code < 400:
                self._log_action(request, response)

        return response

    def _log_action(self, request, response):
        """Log the action asynchronously to avoid slowing down requests."""
        path = request.path

        # Skip high-frequency, low-value paths
        for skip in SKIP_PATHS:
            if path.startswith(skip):
                return

        # Determine module from the URL path
        module = self._extract_module(path)
        action = f'{request.method} {path}'

        try:
            from apps.analytics.models import ActivityLog
            ActivityLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action=action,
                module=module,
                ip_address=(
                    request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
                    or request.META.get('REMOTE_ADDR')
                ),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:300],
            )
        except Exception as e:
            logger.warning(f'ActivityLog middleware error: {e}')

    def _extract_module(self, path):
        """Extract module name from the URL path."""
        # /api/v1/admin/sellers/... → admin
        # /api/v1/orders/... → orders
        match = re.match(r'/api/v1/(?:admin/)?(\w+)/', path)
        if match:
            return match.group(1)
        return 'unknown'
