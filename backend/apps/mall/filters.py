"""
Mall Filters.

Django-filter classes for product search and filtering.
"""

import django_filters

from .models import StoreProduct


class StoreProductFilter(django_filters.FilterSet):
    """
    Product filter supporting:
    - category__slug (includes descendants)
    - store__slug / store
    - price_min / price_max
    - is_featured
    - tags (contains)
    - search (name + description)
    """

    category_slug = django_filters.CharFilter(method='filter_by_category_slug')
    store = django_filters.CharFilter(field_name='store__slug')
    store_slug = django_filters.CharFilter(field_name='store__slug')
    price_min = django_filters.NumberFilter(
        field_name='base_price', lookup_expr='gte',
    )
    price_max = django_filters.NumberFilter(
        field_name='base_price', lookup_expr='lte',
    )
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    tags = django_filters.CharFilter(method='filter_by_tags')
    search = django_filters.CharFilter(method='filter_by_search')

    class Meta:
        model = StoreProduct
        fields = [
            'category_slug', 'store_slug', 'price_min', 'price_max',
            'store', 'is_featured', 'tags', 'search',
        ]

    def filter_by_category_slug(self, queryset, name, value):
        """Filter by category slug, including all descendant categories."""
        from .models import MallCategory
        try:
            category = MallCategory.objects.get(
                slug=value, is_active=True, deleted_at__isnull=True,
            )
        except MallCategory.DoesNotExist:
            return queryset.none()

        descendant_ids = category.get_descendants(include_self=True)
        return queryset.filter(category_id__in=descendant_ids)

    def filter_by_tags(self, queryset, name, value):
        """Filter products containing the specified tag."""
        return queryset.filter(tags__contains=[value])

    def filter_by_search(self, queryset, name, value):
        """Search in product name and description."""
        from django.db.models import Q
        return queryset.filter(
            Q(name__icontains=value) | Q(description__icontains=value)
        )
