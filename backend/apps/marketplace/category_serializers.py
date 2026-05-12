"""
Admin Category Serializers for the Marketplace.

Handles CRUD operations for the 3-level marketplace category hierarchy:
  - Level 0 (parent=null): Categories (e.g., Electronics, Gaming)
  - Level 1 (parent=category): Subcategories (e.g., Smartphones, Laptops)

Main categories are represented by the ad_type field (sell, rent, service, food).
"""

from rest_framework import serializers
from django.utils.text import slugify

from .models import MarketplaceCategory, AD_TYPE_CHOICES


class AdminCategoryCreateSerializer(serializers.ModelSerializer):
    """Create a new marketplace category or subcategory."""

    class Meta:
        model = MarketplaceCategory
        fields = [
            'name', 'slug', 'ad_type', 'parent',
            'sort_order', 'is_active',
        ]

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Name must be at least 2 characters.')
        return value.strip()

    def validate_parent(self, value):
        if value and value.parent is not None:
            raise serializers.ValidationError(
                'Cannot nest deeper than 2 levels. Parent must be a root category.'
            )
        return value

    def validate(self, attrs):
        name = attrs.get('name')
        ad_type = attrs.get('ad_type')
        parent = attrs.get('parent')

        # Check duplicate name within same ad_type and parent
        qs = MarketplaceCategory.objects.filter(
            name__iexact=name,
            ad_type=ad_type,
            parent=parent,
            deleted_at__isnull=True,
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({
                'name': 'A category with this name already exists in this section.'
            })
        return attrs

    def create(self, validated_data):
        if not validated_data.get('slug'):
            base_slug = slugify(f"{validated_data['ad_type']}-{validated_data['name']}")
            slug = base_slug
            counter = 1
            while MarketplaceCategory.all_objects.filter(slug=slug).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            validated_data['slug'] = slug
        return super().create(validated_data)


class AdminCategoryUpdateSerializer(serializers.ModelSerializer):
    """Update an existing marketplace category."""

    class Meta:
        model = MarketplaceCategory
        fields = [
            'name', 'slug', 'sort_order', 'is_active',
        ]
        extra_kwargs = {
            'name': {'required': False},
            'slug': {'required': False},
        }

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Name must be at least 2 characters.')
        return value.strip()

    def validate(self, attrs):
        instance = self.instance
        name = attrs.get('name', instance.name)

        qs = MarketplaceCategory.objects.filter(
            name__iexact=name,
            ad_type=instance.ad_type,
            parent=instance.parent,
            deleted_at__isnull=True,
        ).exclude(pk=instance.pk)

        if qs.exists():
            raise serializers.ValidationError({
                'name': 'A category with this name already exists in this section.'
            })
        return attrs


class AdminCategoryTreeSerializer(serializers.ModelSerializer):
    """Full tree serializer for admin panel — shows all categories with children."""

    children = serializers.SerializerMethodField()
    listing_count = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceCategory
        fields = [
            'id', 'name', 'slug', 'ad_type', 'parent',
            'sort_order', 'is_active',
            'children', 'listing_count',
            'created_at', 'updated_at',
        ]

    def get_children(self, obj):
        children = obj.children.filter(deleted_at__isnull=True).order_by('sort_order', 'name')
        return AdminCategoryTreeSerializer(children, many=True).data

    def get_listing_count(self, obj):
        return obj.products.filter(deleted_at__isnull=True).count()


class AdminCategoryListSerializer(serializers.ModelSerializer):
    """Flat list serializer for admin dropdowns and quick views."""

    parent_name = serializers.CharField(source='parent.name', default=None, read_only=True)
    children_count = serializers.SerializerMethodField()
    listing_count = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceCategory
        fields = [
            'id', 'name', 'slug', 'ad_type', 'parent', 'parent_name',
            'sort_order', 'is_active',
            'children_count', 'listing_count',
            'created_at', 'updated_at',
        ]

    def get_children_count(self, obj):
        return obj.children.filter(deleted_at__isnull=True).count()

    def get_listing_count(self, obj):
        return obj.products.filter(deleted_at__isnull=True).count()


class BulkReorderSerializer(serializers.Serializer):
    """Validate bulk reorder payload."""

    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
    )

    def validate_items(self, value):
        for item in value:
            if 'id' not in item or 'sort_order' not in item:
                raise serializers.ValidationError(
                    'Each item must have "id" and "sort_order" fields.'
                )
            if not isinstance(item['sort_order'], int) or item['sort_order'] < 0:
                raise serializers.ValidationError(
                    'sort_order must be a non-negative integer.'
                )
        return value
