"""Core app — shared base classes, mixins, and utilities for CampusHat."""

# Register drf-spectacular OpenAPI extensions at app load time
try:
    from core import openapi as _openapi_extensions  # noqa: F401
except ImportError:
    pass
