"""
CampusHat Custom Exception Handler.

Wraps DRF's default exception handler to produce a consistent error
response format across all API endpoints:

    {
        "success": false,
        "message": "Human-readable error description",
        "errors": { ... },
        "code": "ERROR_CODE"
    }
"""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied

from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    ValidationError as DRFValidationError,
)
from rest_framework.views import exception_handler


# =============================================================================
# CUSTOM EXCEPTION CLASS
# =============================================================================

class CampusHatException(APIException):
    """
    Base exception for all CampusHat custom errors.

    Subclass this to create domain-specific errors with custom codes.

    Example:
        class InsufficientBalanceError(CampusHatException):
            status_code = 400
            default_detail = 'Insufficient wallet balance.'
            error_code = 'INSUFFICIENT_BALANCE'
    """

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'A server error occurred.'
    error_code = 'ERROR'

    def __init__(self, detail=None, error_code=None, status_code=None):
        if detail is not None:
            self.detail = detail
        else:
            self.detail = self.default_detail

        if error_code is not None:
            self.error_code = error_code

        if status_code is not None:
            self.status_code = status_code


# =============================================================================
# COMMON EXCEPTIONS
# =============================================================================

class NotFoundError(CampusHatException):
    """Resource not found."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    error_code = 'NOT_FOUND'


class ForbiddenError(CampusHatException):
    """Access denied."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    error_code = 'FORBIDDEN'


class ConflictError(CampusHatException):
    """Resource conflict (e.g., duplicate)."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'This resource already exists or conflicts with current state.'
    error_code = 'CONFLICT'


class BadRequestError(CampusHatException):
    """Invalid request data."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'The request data is invalid.'
    error_code = 'BAD_REQUEST'


# =============================================================================
# EXCEPTION HANDLER
# =============================================================================

def custom_exception_handler(exc, context):
    """
    Custom exception handler that ensures all error responses follow
    CampusHat's standard envelope format.

    Handles:
    - DRF exceptions (ValidationError, NotFound, PermissionDenied, etc.)
    - Django exceptions (Http404, ValidationError, PermissionDenied)
    - CampusHatException and subclasses
    """

    # Convert Django exceptions to DRF equivalents
    if isinstance(exc, Http404):
        exc = NotFound(detail='The requested resource was not found.')

    if isinstance(exc, DjangoPermissionDenied):
        exc = PermissionDenied(detail=str(exc))

    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            exc = DRFValidationError(detail=exc.message_dict)
        else:
            exc = DRFValidationError(detail=exc.messages)

    # Get the standard DRF response
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — return a generic 500
        response_data = {
            'success': False,
            'message': 'An unexpected error occurred.',
            'errors': {},
            'code': 'INTERNAL_ERROR',
        }
        from rest_framework.response import Response
        return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Build the consistent error response
    error_code = _get_error_code(exc)
    message = _get_error_message(exc, response)
    errors = _get_error_details(exc, response)

    response.data = {
        'success': False,
        'message': message,
        'errors': errors,
        'code': error_code,
    }

    return response


def _get_error_code(exc) -> str:
    """Extract or generate an error code from the exception."""
    if isinstance(exc, CampusHatException):
        return exc.error_code

    if isinstance(exc, DRFValidationError):
        return 'VALIDATION_ERROR'

    if isinstance(exc, NotFound):
        return 'NOT_FOUND'

    if isinstance(exc, (PermissionDenied, DjangoPermissionDenied)):
        return 'PERMISSION_DENIED'

    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        return 'AUTHENTICATION_ERROR'

    return 'ERROR'


def _get_error_message(exc, response) -> str:
    """Build a human-readable message from the exception."""
    if isinstance(exc, CampusHatException):
        return str(exc.detail)

    if isinstance(exc, DRFValidationError):
        return 'Validation failed. Please check the errors below.'

    if isinstance(exc, NotFound):
        return 'The requested resource was not found.'

    if isinstance(exc, (PermissionDenied, DjangoPermissionDenied)):
        return 'You do not have permission to perform this action.'

    if isinstance(exc, NotAuthenticated):
        return 'Authentication credentials were not provided.'

    if isinstance(exc, AuthenticationFailed):
        return 'Invalid authentication credentials.'

    if hasattr(exc, 'detail'):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list) and len(detail) > 0:
            return str(detail[0])

    return 'An error occurred.'


def _get_error_details(exc, response) -> dict:
    """Extract structured error details for the response."""
    if isinstance(exc, DRFValidationError):
        detail = exc.detail
        if isinstance(detail, dict):
            return detail
        if isinstance(detail, list):
            return {'non_field_errors': detail}
        return {'detail': [str(detail)]}

    return {}
