"""
Marketplace Filters (django-filter).

Provides filterset for marketplace product listing queries.
"""

import django_filters

from .models import MarketplaceProduct


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass

class MarketplaceProductFilter(django_filters.FilterSet):
    """
    FilterSet for marketplace product list endpoint.

    Supports filtering by type, university, category, price range,
    condition, visibility, and negotiability.
    """

    post_type = django_filters.CharFilter(field_name='post_type')
    university = django_filters.UUIDFilter(field_name='university__id')
    university_slug = django_filters.CharFilter(
        field_name='university__slug',
        lookup_expr='exact',
    )
    category = CharInFilter(
        field_name='category__slug',
        lookup_expr='in',
    )
    category_slug = django_filters.CharFilter(
        field_name='category__slug',
        lookup_expr='exact',
    )
    status = django_filters.CharFilter(field_name='status')
    min_price = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='gte',
    )
    max_price = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='lte',
    )
    condition = CharInFilter(field_name='condition', lookup_expr='in')
    campus_visibility = django_filters.CharFilter(field_name='campus_visibility')
    is_negotiable = django_filters.BooleanFilter(field_name='is_negotiable')

    class Meta:
        model = MarketplaceProduct
        fields = [
            'post_type', 'university', 'university_slug', 'category', 'category_slug',
            'status', 'min_price', 'max_price', 'condition',
            'campus_visibility', 'is_negotiable',
        ]
