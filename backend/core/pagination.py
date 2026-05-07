"""
CampusHat Custom Pagination.

Provides consistent paginated response envelopes for all list endpoints.
- CampusHatPagination: page-number based (default, page_size=20)
- CampusHatCursorPagination: cursor-based for feed/timeline endpoints
"""

from collections import OrderedDict

from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response


class CampusHatPagination(PageNumberPagination):
    """
    Standard page-number pagination for CampusHat.

    Supports `?page=2&page_size=50` query params.
    Default: 20 items per page. Maximum: 100.
    """

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

    def get_paginated_response(self, data):
        """Return a consistent paginated response envelope."""
        return Response(OrderedDict([
            ('success', True),
            ('message', 'Data retrieved successfully.'),
            ('data', OrderedDict([
                ('count', self.page.paginator.count),
                ('total_pages', self.page.paginator.num_pages),
                ('current_page', self.page.number),
                ('next', self.get_next_link()),
                ('previous', self.get_previous_link()),
                ('results', data),
            ])),
        ]))

    def get_paginated_response_schema(self, schema):
        """Schema for drf-spectacular."""
        return {
            'type': 'object',
            'properties': {
                'success': {'type': 'boolean', 'example': True},
                'message': {'type': 'string'},
                'data': {
                    'type': 'object',
                    'properties': {
                        'count': {'type': 'integer', 'example': 100},
                        'total_pages': {'type': 'integer', 'example': 5},
                        'current_page': {'type': 'integer', 'example': 1},
                        'next': {'type': 'string', 'nullable': True},
                        'previous': {'type': 'string', 'nullable': True},
                        'results': schema,
                    },
                },
            },
        }


class CampusHatCursorPagination(CursorPagination):
    """
    Cursor-based pagination for feed-style endpoints.

    Uses `created_at` for ordering. Better for real-time data where
    records are frequently added and pagination by page number would
    produce inconsistent results.
    """

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-created_at'

    def get_paginated_response(self, data):
        """Return a consistent paginated response envelope."""
        return Response(OrderedDict([
            ('success', True),
            ('message', 'Data retrieved successfully.'),
            ('data', OrderedDict([
                ('next', self.get_next_link()),
                ('previous', self.get_previous_link()),
                ('results', data),
            ])),
        ]))
