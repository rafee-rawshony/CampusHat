"""
Marketplace Filters (django-filter).

Provides filterset for marketplace product listing queries.
"""

import django_filters
from django.db.models import Q

from .models import MarketplaceCategory, MarketplaceProduct


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class CategoryFilter(django_filters.CharFilter):
    """
    Filters products by category slug(s).
    Supports comma-separated slugs and includes subcategories
    when a parent category slug is provided.
    """

    def filter(self, qs, value):
        if not value:
            return qs

        slugs = [s.strip() for s in value.split(',') if s.strip()]
        if not slugs:
            return qs

        # Find all matching categories (both exact match and children)
        matching_categories = MarketplaceCategory.objects.filter(
            slug__in=slugs, deleted_at__isnull=True
        )

        # Include subcategories of matching parent categories
        all_category_ids = set()
        for cat in matching_categories:
            all_category_ids.add(cat.id)
            # Add children IDs
            children_ids = cat.children.filter(
                deleted_at__isnull=True
            ).values_list('id', flat=True)
            all_category_ids.update(children_ids)

        return qs.filter(category_id__in=all_category_ids)


class MarketplaceProductFilter(django_filters.FilterSet):
    """
    FilterSet for marketplace product list endpoint.

    Supports filtering by type, university, category (with subcategory inclusion),
    price range, condition, visibility, and negotiability.
    """

    post_type = django_filters.CharFilter(field_name='post_type')
    university = django_filters.UUIDFilter(field_name='university__id')
    university_slug = django_filters.CharFilter(
        field_name='university__slug',
        lookup_expr='exact',
    )
    category = CategoryFilter()
    category_slug = django_filters.CharFilter(
        field_name='category__slug',
        lookup_expr='exact',
    )
    category_id = django_filters.UUIDFilter(field_name='category__id')
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
            'post_type', 'university', 'university_slug',
            'category', 'category_slug', 'category_id',
            'status', 'min_price', 'max_price', 'condition',
            'campus_visibility', 'is_negotiable',
        ]
