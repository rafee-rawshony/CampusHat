"""
Email Authentication Backend.

Allows users to authenticate with email + password instead of username.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailBackend(ModelBackend):
    """
    Custom authentication backend that uses email instead of username.
    """

    def authenticate(self, request, email=None, password=None, **kwargs):
        UserModel = get_user_model()

        if email is None:
            email = kwargs.get('username', '')

        try:
            user = UserModel.objects.get(email__iexact=email)
        except UserModel.DoesNotExist:
            # Run the default hasher to prevent timing attacks
            UserModel().set_password(password)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None
