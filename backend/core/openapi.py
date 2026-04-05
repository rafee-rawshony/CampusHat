"""
OpenAPI Extensions for drf-spectacular.

Registers the custom RevokedSessionJWTAuthentication class
so that drf-spectacular can generate proper security schemes
for Swagger/ReDoc documentation.
"""

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class RevokedSessionJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    """
    Tell drf-spectacular how to document our custom JWT auth class.
    It behaves identically to SimpleJWT (Bearer token in header).
    """

    target_class = 'core.authentication.RevokedSessionJWTAuthentication'
    name = 'jwtAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': (
                'JWT access token. Obtain via POST /api/v1/auth/login/. '
                'Include as: Authorization: Bearer <token>'
            ),
        }
