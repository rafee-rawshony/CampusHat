"""
CampusHat JSON Renderer.

Wraps all API responses in a consistent envelope format:

Success:
    {
        "success": true,
        "message": "...",
        "data": { ... }
    }

Error (handled by custom_exception_handler):
    {
        "success": false,
        "message": "...",
        "errors": { ... },
        "code": "ERROR_CODE"
    }
"""

import json

from rest_framework.renderers import JSONRenderer


class CampusHatJSONRenderer(JSONRenderer):
    """
    Custom JSON renderer that wraps all responses in CampusHat's
    standard envelope format for API consistency.

    The error envelope is handled by `core.exceptions.custom_exception_handler`,
    so this renderer only needs to wrap successful responses.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render the response data into JSON with the standard envelope.

        If the response already has the CampusHat envelope (contains
        'success' key), pass it through unchanged. Otherwise, wrap it.
        """
        response = renderer_context.get('response') if renderer_context else None

        # Don't wrap error responses — they're already formatted by the
        # custom exception handler
        if response and response.status_code >= 400:
            return super().render(data, accepted_media_type, renderer_context)

        # Don't double-wrap responses that already have our envelope
        if isinstance(data, dict) and 'success' in data:
            return super().render(data, accepted_media_type, renderer_context)

        # Wrap successful responses
        wrapped = {
            'success': True,
            'message': 'Request successful.',
            'data': data,
        }

        return super().render(wrapped, accepted_media_type, renderer_context)
