"""
Marketplace Filters (django-filter).

Provides filterset for marketplace product listing queries.
"""

import django_filters

from .models import MarketplaceProduct


class MarketplaceProductFilter(django_filters.FilterSet):
    """
    FilterSet for marketplace product list endpoint.

    Supports filtering by type, university, category, price range,
    condition, visibility, and negotiability.
    """

    post_type = django_filters.CharFilter(field_name='post_type')
    university_slug = django_filters.CharFilter(
        field_name='university__slug',
        lookup_expr='exact',
    )
    category_slug = django_filters.CharFilter(
        field_name='category__slug',
        lookup_expr='exact',
    )
    status = django_filters.CharFilter(field_name='status')
    price_min = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='gte',
    )
    price_max = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='lte',
    )
    condition = django_filters.CharFilter(field_name='condition')
    campus_visibility = django_filters.CharFilter(field_name='campus_visibility')
    is_negotiable = django_filters.BooleanFilter(field_name='is_negotiable')

    class Meta:
        model = MarketplaceProduct
        fields = [
            'post_type', 'university_slug', 'category_slug',
            'status', 'price_min', 'price_max', 'condition',
            'campus_visibility', 'is_negotiable',
        ]
