"""
CampusHat Marketplace Models.

Phase 04: Campus Marketplace with full post lifecycle, auto-expiry,
campus filtering, chat, offers, reviews, reports, and admin moderation.

Models:
  1. MarketplaceCategory   — 3-level hierarchy, per ad_type
  2. MarketplaceProduct    — full post lifecycle with ActiveManager
  3. MarketplaceProductImage — multi-image per product
  4. MarketplaceOffer      — price negotiation
  5. MarketplaceChat       — per-product buyer-seller thread
  6. MarketplaceMessage    — chat messages
  7. MarketplaceReview     — seller reviews (1-5 rating)
  8. MarketplaceReport     — content moderation reports
"""

from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction
from django.utils import timezone
from django.utils.text import slugify

from core.models import BaseModel, TimestampMixin, UUIDMixin


# =============================================================================
# CHOICES
# =============================================================================

DELIVERY_OPTION_CHOICES = [
    ('meetup', 'Campus Meetup'),
    ('delivery', 'Delivery'),
    ('both', 'Both'),
]

CONTACT_PREF_CHOICES = [
    ('chat', 'In-App Chat'),
    ('phone', 'Phone Call'),
    ('both', 'Both'),
]

PORTION_SIZE_CHOICES = [
    ('small', 'Small'),
    ('regular', 'Regular'),
    ('large', 'Large'),
    ('family', 'Family Pack'),
]

AD_TYPE_CHOICES = [
    ('sell', 'Sell'),
    ('rent', 'Rent'),
    ('service', 'Service'),
    ('food', 'Food'),
]

PRODUCT_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('active', 'Active'),
    ('expired', 'Expired'),
    ('hidden', 'Hidden'),
    ('sold', 'Sold'),
    ('rejected', 'Rejected'),
    ('deleted', 'Deleted'),
]

CONDITION_CHOICES = [
    ('like_new', 'Like New'),
    ('good', 'Good'),
    ('fair', 'Fair'),
    ('for_parts', 'For Parts'),
]

VISIBILITY_CHOICES = [
    ('university_only', 'University Only'),
    ('all_universities', 'All Universities'),
]

OFFER_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('accepted', 'Accepted'),
    ('rejected', 'Rejected'),
    ('countered', 'Countered'),
    ('withdrawn', 'Withdrawn'),
]

MESSAGE_TYPE_CHOICES = [
    ('text', 'Text'),
    ('image', 'Image'),
    ('offer_ref', 'Offer Reference'),
]

REPORT_REASON_CHOICES = [
    ('spam', 'Spam'),
    ('fake', 'Fake'),
    ('prohibited', 'Prohibited'),
    ('scam', 'Scam'),
    ('inappropriate', 'Inappropriate'),
    ('other', 'Other'),
]

REPORT_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('reviewed', 'Reviewed'),
    ('dismissed', 'Dismissed'),
    ('actioned', 'Actioned'),
]

# Duration validation rules
SELL_RENT_DURATIONS = [7, 15, 30]
SERVICE_FOOD_DURATIONS = [30, 90, 180]


# =============================================================================
# CUSTOM MANAGERS
# =============================================================================

class ActiveProductManager(models.Manager):
    """
    Returns only active, non-expired, non-hidden, non-deleted products.
    Used for public-facing queries.
    """

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                status='active',
                expires_at__gt=timezone.now(),
                is_hidden_by_user=False,
                is_hidden_by_admin=False,
                deleted_at__isnull=True,
            )
        )


# =============================================================================
# MODEL 1: MARKETPLACE CATEGORY
# =============================================================================

class MarketplaceCategory(BaseModel):
    """
    3-level hierarchical category for marketplace ads.

    Supports ad_type filtering (sell, rent, service, food) so categories
    can be different per ad type.
    """

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    ad_type = models.CharField(
        max_length=10,
        choices=AD_TYPE_CHOICES,
        db_index=True,
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
    )
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = 'marketplace_categories'
        unique_together = ('name', 'ad_type', 'parent')
        ordering = ['ad_type', 'sort_order', 'name']
        verbose_name_plural = 'Marketplace Categories'

    def __str__(self):
        return f'{self.name} ({self.ad_type})'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f'{self.ad_type}-{self.name}')
            slug = base_slug
            counter = 1
            while MarketplaceCategory.all_objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


# =============================================================================
# MODEL 2: MARKETPLACE PRODUCT
# =============================================================================

class MarketplaceProduct(BaseModel):
    """
    Core marketplace listing with full post lifecycle.

    Lifecycle: pending → active (admin approved) → expired / sold / hidden
    Repost: expired/hidden → pending (re-approval)
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='marketplace_products',
        db_index=True,
    )
    university = models.ForeignKey(
        'universities.University',
        on_delete=models.CASCADE,
        related_name='marketplace_products',
        db_index=True,
    )
    category = models.ForeignKey(
        MarketplaceCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products',
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    post_type = models.CharField(
        max_length=10,
        choices=AD_TYPE_CHOICES,
        db_index=True,
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    price_unit = models.CharField(max_length=30, blank=True, null=True)
    condition = models.CharField(
        max_length=15,
        choices=CONDITION_CHOICES,
        blank=True,
        null=True,
    )
    is_negotiable = models.BooleanField(default=False)
    campus_visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default='university_only',
        db_index=True,
    )
    status = models.CharField(
        max_length=10,
        choices=PRODUCT_STATUS_CHOICES,
        default='pending',
        db_index=True,
    )
    duration_days = models.IntegerField()
    expires_at = models.DateTimeField(db_index=True, null=True, blank=True)
    is_hidden_by_user = models.BooleanField(default=False)
    is_hidden_by_admin = models.BooleanField(default=False)
    is_auto_expired = models.BooleanField(default=False)
    repost_count = models.IntegerField(default=0)
    rejection_reason = models.TextField(blank=True, null=True)
    safe_meetup_location = models.CharField(max_length=200, blank=True, null=True)
    view_count = models.IntegerField(default=0)

    # ------------------------------------------------------------------
    # SELL-specific fields
    # ------------------------------------------------------------------
    brand = models.CharField(max_length=100, blank=True, null=True)
    model_name = models.CharField(max_length=100, blank=True, null=True)
    usage_duration = models.CharField(max_length=100, blank=True, null=True)
    delivery_option = models.CharField(
        max_length=10, choices=DELIVERY_OPTION_CHOICES, blank=True, null=True,
    )

    # ------------------------------------------------------------------
    # RENT-specific fields
    # ------------------------------------------------------------------
    location = models.CharField(max_length=300, blank=True, null=True)
    availability_date = models.DateField(blank=True, null=True)
    rental_duration = models.CharField(max_length=100, blank=True, null=True)
    deposit_amount = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
    )
    facilities = models.TextField(blank=True, null=True)
    room_details = models.TextField(blank=True, null=True)
    rules_conditions = models.TextField(blank=True, null=True)
    contact_preference = models.CharField(
        max_length=10, choices=CONTACT_PREF_CHOICES, blank=True, null=True,
    )

    # ------------------------------------------------------------------
    # SERVICE-specific fields
    # ------------------------------------------------------------------
    skills = models.TextField(blank=True, null=True)
    experience = models.CharField(max_length=200, blank=True, null=True)
    delivery_time = models.CharField(max_length=100, blank=True, null=True)
    availability_hours = models.CharField(max_length=200, blank=True, null=True)
    portfolio_url = models.URLField(max_length=500, blank=True, null=True)
    previous_work_desc = models.TextField(blank=True, null=True)

    # ------------------------------------------------------------------
    # FOOD-specific fields
    # ------------------------------------------------------------------
    ingredients = models.TextField(blank=True, null=True)
    portion_size = models.CharField(
        max_length=10, choices=PORTION_SIZE_CHOICES, blank=True, null=True,
    )
    delivery_area = models.CharField(max_length=300, blank=True, null=True)
    food_delivery_time = models.CharField(max_length=100, blank=True, null=True)
    daily_availability = models.CharField(max_length=200, blank=True, null=True)
    hygiene_certification = models.TextField(blank=True, null=True)
    combo_packages = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_ads',
    )

    # Managers — inherits objects (SoftDeleteManager) and all_objects from BaseModel
    active_objects = ActiveProductManager()

    class Meta(BaseModel.Meta):
        db_table = 'marketplace_products'
        indexes = [
            models.Index(fields=['university', 'status', 'post_type']),
            models.Index(fields=['expires_at', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['campus_visibility', 'status']),
        ]

    def __str__(self):
        return f'{self.title} ({self.status})'

    def clean(self):
        """Validate duration_days per post_type."""
        super().clean()
        if self.post_type in ('sell', 'rent'):
            if self.duration_days not in SELL_RENT_DURATIONS:
                raise ValidationError({
                    'duration_days': f'For {self.post_type}, duration must be '
                                     f'one of {SELL_RENT_DURATIONS}.',
                })
        elif self.post_type in ('service', 'food'):
            if self.duration_days not in SERVICE_FOOD_DURATIONS:
                raise ValidationError({
                    'duration_days': f'For {self.post_type}, duration must be '
                                     f'one of {SERVICE_FOOD_DURATIONS}.',
                })

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        if is_new and not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=self.duration_days)
        super().save(*args, **kwargs)


# =============================================================================
# MODEL 3: MARKETPLACE PRODUCT IMAGE
# =============================================================================

class MarketplaceProductImage(UUIDMixin, TimestampMixin):
    """Images for marketplace products. Max 8 per product."""

    product = models.ForeignKey(
        MarketplaceProduct,
        on_delete=models.CASCADE,
        related_name='images',
        db_index=True,
    )
    image_url = models.CharField(max_length=500)
    sort_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = 'marketplace_product_images'
        ordering = ['sort_order']

    def __str__(self):
        return f'Image for {self.product.title} (order={self.sort_order})'


# =============================================================================
# MODEL 4: MARKETPLACE OFFER
# =============================================================================

class MarketplaceOffer(BaseModel):
    """
    Price negotiation on a marketplace listing.

    One open offer per buyer per product. Expires after 48 hours.
    """

    product = models.ForeignKey(
        MarketplaceProduct,
        on_delete=models.CASCADE,
        related_name='offers',
        db_index=True,
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='marketplace_offers',
    )
    offered_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    counter_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        blank=True, null=True,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    status = models.CharField(
        max_length=15,
        choices=OFFER_STATUS_CHOICES,
        default='pending',
    )
    message = models.TextField(blank=True, null=True)
    expires_at = models.DateTimeField()

    class Meta(BaseModel.Meta):
        db_table = 'marketplace_offers'
        unique_together = ('product', 'buyer')

    def __str__(self):
        return f'Offer by {self.buyer} on {self.product.title}'

    def save(self, *args, **kwargs):
        if self._state.adding and not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)


# =============================================================================
# MODEL 5: MARKETPLACE CHAT
# =============================================================================

class MarketplaceChat(BaseModel):
    """
    Per-product buyer-seller chat thread.

    One chat per product per buyer. The seller is inferred from
    product.user.
    """

    product = models.ForeignKey(
        MarketplaceProduct,
        on_delete=models.CASCADE,
        related_name='chats',
        db_index=True,
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_chats',
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_chats',
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_blocked = models.BooleanField(default=False)
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta(BaseModel.Meta):
        db_table = 'marketplace_chats'
        unique_together = ('product', 'buyer')

    def __str__(self):
        return f'Chat: {self.buyer} ↔ {self.seller} on {self.product.title}'


# =============================================================================
# MODEL 6: MARKETPLACE MESSAGE
# =============================================================================

class MarketplaceMessage(UUIDMixin, TimestampMixin):
    """Individual messages inside a marketplace chat thread."""

    chat = models.ForeignKey(
        MarketplaceChat,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True,
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='marketplace_messages',
    )
    message_type = models.CharField(
        max_length=15,
        choices=MESSAGE_TYPE_CHOICES,
        default='text',
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = 'marketplace_messages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['chat', 'created_at']),
        ]

    def __str__(self):
        return f'Msg by {self.sender} in chat {self.chat_id}'


# =============================================================================
# MODEL 7: MARKETPLACE REVIEW
# =============================================================================

class MarketplaceReview(BaseModel):
    """
    Seller review on a marketplace product.

    One review per product per reviewer. Rating 1-5.
    """

    product = models.ForeignKey(
        MarketplaceProduct,
        on_delete=models.CASCADE,
        related_name='reviews',
        db_index=True,
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='marketplace_reviews_given',
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='marketplace_reviews_received',
        db_index=True,
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(blank=True, null=True)
    is_verified_transaction = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        db_table = 'marketplace_reviews'
        unique_together = ('product', 'reviewer')

    def __str__(self):
        return f'Review by {self.reviewer} for {self.product.title}'


# =============================================================================
# MODEL 8: MARKETPLACE REPORT
# =============================================================================

class MarketplaceReport(BaseModel):
    """Content moderation reports on marketplace listings."""

    product = models.ForeignKey(
        MarketplaceProduct,
        on_delete=models.CASCADE,
        related_name='reports',
        db_index=True,
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='marketplace_reports',
    )
    reason = models.CharField(
        max_length=20,
        choices=REPORT_REASON_CHOICES,
    )
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=15,
        choices=REPORT_STATUS_CHOICES,
        default='pending',
        db_index=True,
    )
    admin_note = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_reports',
    )

    class Meta(BaseModel.Meta):
        db_table = 'marketplace_reports'
        unique_together = ('product', 'reporter')

    def __str__(self):
        return f'Report on {self.product.title} by {self.reporter}'
