"""
Session Serializers.

Read-only serializer for listing active user sessions.
"""

from rest_framework import serializers

from .models import UserSession


class UserSessionSerializer(serializers.ModelSerializer):
    """Read-only serializer for user session display."""

    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = [
            'id', 'device_info', 'ip_address',
            'expires_at', 'revoked', 'created_at',
            'is_current',
        ]
        read_only_fields = fields

    def get_is_current(self, obj):
        """
        Check if this session matches the current request's token.

        Compares the token hash of this session with the hash of the
        current access token from the Authorization header.
        """
        import hashlib
        request = self.context.get('request')
        if not request:
            return False
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
            current_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
            return obj.token_hash == current_hash
        return False
