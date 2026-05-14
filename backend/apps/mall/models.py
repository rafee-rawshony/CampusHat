"""
CampusHat Mall Models.

Phase 06: E-commerce mall with categories, products, variants, cart,
and product reviews.

Models:
  1. MallCategory        — 3-level hierarchy
  2. StoreProduct        — full product with tags, variants toggle
  3. StoreProductImage   — multi-image per product
  4. ProductVariant      — JSONB attributes, per-variant stock
  5. ProductReview       — verified purchase, seller response
  6. Cart                — one per user
  7. CartItem            — price snapshot on add
"""

from decimal import Decimal

from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify

from core.models import BaseModel, TimestampMixin, UUIDMixin


# =============================================================================
# MODEL 1: MALL CATEGORY
# =============================================================================

class MallCategory(BaseModel):
    """
    3-level hierarchical category for the CampusHat Mall.

    Supports Main → Sub → Sub-Sub nesting with sort_order.
    """

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        db_index=True,
    )
    level = models.PositiveSmallIntegerField(
        default=1,
        help_text='Hierarchy level: 1=Main, 2=Sub, 3=Sub-Sub.',
    )
    icon_url = models.CharField(max_length=300, blank=True, null=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta(BaseModel.Meta):
        db_table = 'mall_categories'
        verbose_name = 'Mall Category'
        verbose_name_plural = 'Mall Categories'
        ordering = ['level', 'sort_order', 'name']
        indexes = [
            models.Index(fields=['parent', 'is_active']),
        ]

    def __str__(self):
        return self.full_path

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while MallCategory.all_objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug

        # Auto-set level from parent
        if self.parent:
            self.level = self.parent.level + 1
        else:
            self.level = 1

        super().save(*args, **kwargs)

    @property
    def full_path(self):
        """Return breadcrumb path: 'Electronics > Mobile Phones > Smartphones'."""
        parts = [self.name]
        parent = self.parent
        while parent:
            parts.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(parts)

    @classmethod
    def get_full_tree(cls):
        """
        Return the entire category tree as a nested dict structure.

        Uses efficient prefetching to avoid N+1 queries.
        """
        categories = list(
            cls.objects.filter(
                is_active=True, deleted_at__isnull=True,
            ).select_related('parent').order_by('level', 'sort_order', 'name')
        )

        cat_map = {}
        roots = []

        for cat in categories:
            cat_map[cat.pk] = {
                'id': str(cat.id),
                'name': cat.name,
                'slug': cat.slug,
                'level': cat.level,
                'parent': str(cat.parent_id) if cat.parent_id else None,
                'parent_id': str(cat.parent_id) if cat.parent_id else None,
                'parent_name': cat.parent.name if cat.parent_id else None,
                'icon_url': cat.icon_url,
                'icon': cat.icon_url,
                'sort_order': cat.sort_order,
                'display_order': cat.sort_order,
                'is_active': cat.is_active,
                'product_count': cat.products.filter(
                    is_active=True, deleted_at__isnull=True,
                ).count(),
                'children': [],
            }

        for cat in categories:
            node = cat_map[cat.pk]
            if cat.parent_id and cat.parent_id in cat_map:
                cat_map[cat.parent_id]['children'].append(node)
            elif not cat.parent_id:
                roots.append(node)

        return roots

    def get_descendants(self, include_self=True):
        """Return all descendant category IDs (for filtering products)."""
        ids = [self.pk] if include_self else []
        children = MallCategory.objects.filter(
            parent=self, is_active=True, deleted_at__isnull=True,
        )
        for child in children:
            ids.extend(child.get_descendants(include_self=True))
        return ids


# =============================================================================
# MODEL 1B: BRAND
# =============================================================================

class Brand(BaseModel):
    """
    Product brand, optionally linked to products for filtering.
    """

    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    logo_url = models.CharField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta(BaseModel.Meta):
        db_table = 'mall_brands'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Brand.all_objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


# =============================================================================
# MODEL 2: STORE PRODUCT
# =============================================================================

class StoreProduct(BaseModel):
    """
    Full e-commerce product in the CampusHat Mall.

    Belongs to a Store (from apps.sellers). Supports variants,
    tags, and stock management.
    """

    store = models.ForeignKey(
        'sellers.Store',
        on_delete=models.CASCADE,
        related_name='products',
        db_index=True,
    )
    category = models.ForeignKey(
        MallCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )
    brand = models.ForeignKey(
        Brand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        db_index=True,
    )
    name = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, unique=True, db_index=True)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True, null=True)
    base_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    sku = models.CharField(max_length=100, blank=True, null=True, unique=True)
    stock_quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Total stock. Auto-updated from variants if has_variants=True.',
    )
    has_variants = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    weight_grams = models.IntegerField(blank=True, null=True)
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Tag list, e.g. ['laptop', 'gaming', 'asus'].",
    )
    rating_avg = models.DecimalField(
        max_digits=3, decimal_places=2, default=0.00,
    )
    review_count = models.IntegerField(default=0)
    sold_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)

    class Meta(BaseModel.Meta):
        db_table = 'mall_store_products'
        indexes = [
            models.Index(fields=['store', 'is_active']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['is_active']),
            GinIndex(fields=['tags']),
        ]

    def __str__(self):
        return f'{self.name} ({self.store.name})'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f'{self.store.slug}-{self.name}')[:320]
            slug = base_slug
            counter = 1
            while StoreProduct.all_objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'[:320]
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def current_price(self):
        """Return discount_price if set, else base_price."""
        if self.discount_price is not None:
            return self.discount_price
        return self.base_price

    @property
    def is_in_stock(self):
        """Check if product has stock available."""
        return self.stock_quantity > 0


# =============================================================================
# MODEL 3: STORE PRODUCT IMAGE
# =============================================================================

class StoreProductImage(UUIDMixin, TimestampMixin):
    """Images for mall products. Max 8 per product."""

    product = models.ForeignKey(
        StoreProduct,
        on_delete=models.CASCADE,
        related_name='images',
        db_index=True,
    )
    image_url = models.CharField(max_length=500)
    alt_text = models.CharField(max_length=200, blank=True, null=True)
    sort_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = 'mall_store_product_images'
        ordering = ['sort_order']

    def __str__(self):
        return f'Image for {self.product.name} (order={self.sort_order})'


# =============================================================================
# MODEL 4: PRODUCT VARIANT
# =============================================================================

class ProductVariant(BaseModel):
    """
    Product variant with JSONB attributes and per-variant stock.

    Example attributes: {'color': 'Red', 'size': 'XL'}
    The parent product's stock_quantity is auto-updated via signal.
    """

    product = models.ForeignKey(
        StoreProduct,
        on_delete=models.CASCADE,
        related_name='variants',
        db_index=True,
    )
    name = models.CharField(
        max_length=100,
        help_text="Display name, e.g. 'Red / XL'.",
    )
    sku = models.CharField(max_length=100, blank=True, null=True, unique=True)
    price_override = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Override price. Falls back to product base_price if null.',
    )
    stock_quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    attributes = models.JSONField(
        help_text="Variant attributes, e.g. {'color':'Red','size':'XL'}.",
    )
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = 'mall_product_variants'

    def __str__(self):
        return f'{self.product.name} — {self.name}'

    @property
    def effective_price(self):
        """Return price_override if set, else product base_price."""
        if self.price_override is not None:
            return self.price_override
        return self.product.base_price


# =============================================================================
# MODEL 5: PRODUCT REVIEW
# =============================================================================

class ProductReview(BaseModel):
    """
    Verified-purchase product review with seller response.

    One review per product per reviewer. Rating 1-5.
    """

    product = models.ForeignKey(
        StoreProduct,
        on_delete=models.CASCADE,
        related_name='reviews',
        db_index=True,
    )
    # order_item FK uses string ref to avoid circular import
    # Will be connected when orders app is built (Phase 07)
    order_item_id = models.UUIDField(
        blank=True, null=True, unique=True,
        help_text='UUID of the OrderItem (from orders app). Linked in Phase 07.',
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mall_reviews_given',
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(blank=True, null=True)
    evidence_urls = models.JSONField(
        default=list, blank=True,
        help_text='List of image URLs provided by the buyer for this review.',
    )
    seller_response = models.TextField(blank=True, null=True)
    seller_responded_at = models.DateTimeField(blank=True, null=True)
    is_visible = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = 'mall_product_reviews'
        unique_together = ('product', 'reviewer')

    def __str__(self):
        return f'Review by {self.reviewer} for {self.product.name}'


# =============================================================================
# MODEL 6: CART
# =============================================================================

class Cart(UUIDMixin, TimestampMixin):
    """
    Shopping cart — one per user.

    Coupon FK uses string ref ('coupons.Coupon') to avoid
    circular import; will be connected in Phase 08.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart',
    )
    # coupon = models.ForeignKey(
    #     'coupons.Coupon', on_delete=models.SET_NULL,
    #     null=True, blank=True, related_name='carts',
    # )
    # Placeholder until coupons app is built:
    coupon_code = models.CharField(
        max_length=50, blank=True, null=True,
        help_text='Coupon code (placeholder until coupons app, Phase 08).',
    )

    class Meta:
        db_table = 'mall_carts'
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'

    def __str__(self):
        return f'Cart for {self.user.email}'


# =============================================================================
# MODEL 7: CART ITEM
# =============================================================================

class CartItem(UUIDMixin, TimestampMixin):
    """
    Individual item in a cart with price snapshot.

    unit_price_snapshot is set at add-to-cart time and never
    recalculated — it reflects the price the user saw when adding.
    """

    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        db_index=True,
    )
    product = models.ForeignKey(
        StoreProduct,
        on_delete=models.CASCADE,
        related_name='cart_items',
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cart_items',
    )
    flash_sale_product = models.ForeignKey(
        'coupons.FlashSaleProduct',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cart_items',
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )
    unit_price_snapshot = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Price at the time of adding to cart.',
    )

    class Meta:
        db_table = 'mall_cart_items'
        unique_together = ('cart', 'product', 'variant')

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'

    @property
    def line_total(self):
        """Calculate line total for this cart item."""
        return self.unit_price_snapshot * self.quantity


# =============================================================================
# MODEL 8: WISHLIST
# =============================================================================

class Banner(UUIDMixin, TimestampMixin):
    """Hero carousel banner for the mall homepage."""

    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    image = models.ImageField(upload_to='banners/', blank=True, null=True)
    image_url = models.URLField(blank=True)
    link_url = models.CharField(max_length=500, blank=True)
    badge_text = models.CharField(max_length=100, blank=True)
    cta_text = models.CharField(max_length=100, default='Shop Now')
    is_active = models.BooleanField(default=True)
    ordering = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'mall_banners'
        ordering = ['ordering', '-created_at']

    def __str__(self):
        return self.title


class Wishlist(UUIDMixin, TimestampMixin):
    """User's saved products for later purchase."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist_items',
        db_index=True,
    )
    product = models.ForeignKey(
        StoreProduct,
        on_delete=models.CASCADE,
        related_name='wishlisted_by',
        db_index=True,
    )

    class Meta:
        db_table = 'mall_wishlists'
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.product.name}'


# =============================================================================
# MODEL 9: PRODUCT QUESTION
# =============================================================================

class ProductQuestion(BaseModel):
    """
    Buyer Q&A on products.

    Buyers can ask questions about a product. The seller (store owner)
    can respond with an answer. Questions are publicly visible.
    """

    product = models.ForeignKey(
        StoreProduct,
        on_delete=models.CASCADE,
        related_name='questions',
        db_index=True,
    )
    asker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='product_questions_asked',
    )
    question = models.TextField(max_length=500)
    answer = models.TextField(blank=True, null=True)
    answered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='product_questions_answered',
    )
    answered_at = models.DateTimeField(blank=True, null=True)
    is_visible = models.BooleanField(default=True)
    vote_count = models.IntegerField(default=0)

    class Meta(BaseModel.Meta):
        db_table = 'mall_product_questions'
        ordering = ['-vote_count', '-created_at']

    def __str__(self):
        return f'Q: {self.question[:50]} ({self.product.name})'


# =============================================================================
# CHAT
# =============================================================================

class StoreChat(BaseModel):
    """
    Chat between a buyer and a mall store.
    """

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mall_buyer_chats',
    )
    store = models.ForeignKey(
        'sellers.Store',
        on_delete=models.CASCADE,
        related_name='chats',
    )
    is_blocked = models.BooleanField(default=False)
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta(BaseModel.Meta):
        db_table = 'mall_store_chats'
        unique_together = ('buyer', 'store')

    def __str__(self):
        return f'Chat: {self.buyer} ↔ {self.store.name}'


class StoreMessage(UUIDMixin, TimestampMixin):
    """Messages inside a StoreChat."""

    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('product_ref', 'Product Reference'),
    ]

    chat = models.ForeignKey(
        StoreChat,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True,
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mall_store_messages',
    )
    message_type = models.CharField(
        max_length=15,
        choices=MESSAGE_TYPE_CHOICES,
        default='text',
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = 'mall_store_messages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['chat', 'created_at']),
        ]

    def __str__(self):
        return f'Msg by {self.sender} in mall chat {self.chat_id}'

