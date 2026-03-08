"""
CampusHat Seller System Models.

Phase 05: Seller registration, stores, badges, payouts, and student benefits.

Models:
  1. SellerProfile   — BD law document fields, Fernet-encrypted financials
  2. Store           — storefront with slug URL, logo, banner, status
  3. SellerBadge     — student_seller, verified_seller, etc.
  4. SellerPayoutRequest — payout withdrawal requests
  5. StudentBenefit  — commission discounts for student sellers
"""

import base64
import os
import uuid

from cryptography.fernet import Fernet
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from decimal import Decimal
from django.utils import timezone
from django.utils.text import slugify

from core.models import BaseModel, TimestampMixin, UUIDMixin


# =============================================================================
# ENCRYPTION HELPERS
# =============================================================================

def _get_fernet():
    """Get Fernet cipher from ENCRYPTION_KEY env var."""
    key = getattr(settings, 'ENCRYPTION_KEY', '') or os.environ.get('ENCRYPTION_KEY', '')
    if not key:
        # Fallback: derive from SECRET_KEY for dev
        raw = settings.SECRET_KEY.encode()[:32].ljust(32, b'0')
        key = base64.urlsafe_b64encode(raw).decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_value(value):
    """Encrypt a string value using Fernet symmetric encryption."""
    if not value:
        return value
    f = _get_fernet()
    return f.encrypt(value.encode()).decode()


def decrypt_value(value):
    """Decrypt a Fernet-encrypted string value."""
    if not value:
        return value
    try:
        f = _get_fernet()
        return f.decrypt(value.encode()).decode()
    except Exception:
        return value


# =============================================================================
# CHOICES
# =============================================================================

BUSINESS_TYPE_CHOICES = [
    ('individual', 'Individual'),
    ('student', 'Student'),
    ('club', 'Club'),
    ('business', 'Business'),
    ('brand', 'Brand'),
]

SELLER_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('suspended', 'Suspended'),
    ('rejected', 'Rejected'),
]

STORE_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('under_review', 'Under Review'),
    ('active', 'Active'),
    ('suspended', 'Suspended'),
    ('rejected', 'Rejected'),
]

BADGE_TYPE_CHOICES = [
    ('student_seller', 'Student Seller'),
    ('verified_seller', 'Verified Seller'),
    ('official_store', 'Official Store'),
    ('best_seller', 'Best Seller'),
    ('club_seller', 'Club Seller'),
    ('fast_dispatch', 'Fast Dispatch'),
]

MOBILE_BANKING_CHOICES = [
    ('bkash', 'bKash'),
    ('nagad', 'Nagad'),
    ('rocket', 'Rocket'),
]

PAYOUT_METHOD_CHOICES = [
    ('bank', 'Bank Transfer'),
    ('bkash', 'bKash'),
    ('nagad', 'Nagad'),
    ('rocket', 'Rocket'),
]

PAYOUT_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('processing', 'Processing'),
    ('completed', 'Completed'),
    ('rejected', 'Rejected'),
]

BENEFIT_TYPE_CHOICES = [
    ('commission_discount', 'Commission Discount'),
    ('free_listing', 'Free Listing'),
    ('priority_ranking', 'Priority Ranking'),
]


# =============================================================================
# MODEL 1: SELLER PROFILE
# =============================================================================

class SellerProfile(BaseModel):
    """
    Seller registration with BD law document fields.

    Financial details (bank_account_details, mobile_banking_number)
    are encrypted using Fernet symmetric encryption.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_profile',
        db_index=True,
    )
    business_name = models.CharField(max_length=200)
    business_type = models.CharField(
        max_length=20,
        choices=BUSINESS_TYPE_CHOICES,
    )

    # BD Law Documents (S3 private)
    nid_number = models.CharField(max_length=100, blank=True, null=True)
    nid_front_url = models.CharField(max_length=500, blank=True, null=True)
    nid_back_url = models.CharField(max_length=500, blank=True, null=True)
    trade_license_url = models.CharField(max_length=500, blank=True, null=True)
    tin_cert_url = models.CharField(max_length=500, blank=True, null=True)
    vat_cert_url = models.CharField(max_length=500, blank=True, null=True)
    brand_auth_letter_url = models.CharField(max_length=500, blank=True, null=True)
    trademark_cert_url = models.CharField(max_length=500, blank=True, null=True)

    # Financial (encrypted)
    bank_account_details = models.TextField(blank=True, null=True)
    mobile_banking_method = models.CharField(
        max_length=10,
        choices=MOBILE_BANKING_CHOICES,
        blank=True, null=True,
    )
    mobile_banking_number = models.CharField(max_length=500, blank=True, null=True)

    # Contact
    business_phone = models.CharField(max_length=20)
    business_email = models.EmailField(max_length=255, blank=True, null=True)

    # Status
    status = models.CharField(
        max_length=15,
        choices=SELLER_STATUS_CHOICES,
        default='pending',
        db_index=True,
    )
    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('10.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00')),
        ]
    )
    is_student_seller = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_sellers',
    )

    class Meta(BaseModel.Meta):
        db_table = 'seller_profiles'
        indexes = [
            models.Index(fields=['status', 'is_student_seller']),
        ]

    def __str__(self):
        return f'{self.business_name} ({self.status})'

    @property
    def is_approved(self):
        return self.status == 'approved'

    def set_bank_details(self, details_dict):
        """Encrypt and store bank account details as JSON string."""
        import json
        self.bank_account_details = encrypt_value(json.dumps(details_dict))

    def get_bank_details(self):
        """Decrypt and return bank account details as dict."""
        import json
        if not self.bank_account_details:
            return None
        try:
            return json.loads(decrypt_value(self.bank_account_details))
        except Exception:
            return None

    def set_mobile_number(self, number):
        """Encrypt mobile banking number."""
        self.mobile_banking_number = encrypt_value(number)

    def get_mobile_number(self):
        """Decrypt mobile banking number."""
        return decrypt_value(self.mobile_banking_number)

    def save(self, *args, **kwargs):
        # Encrypt NID number if not already encrypted
        if self.nid_number and not self.nid_number.startswith('gAAAAA'):
            self.nid_number = encrypt_value(self.nid_number)
        super().save(*args, **kwargs)

    def _cascade_soft_delete(self):
        # Soft-delete the seller's store, which cascades to products
        try:
            if hasattr(self, 'store') and self.store:
                self.store.soft_delete(cascade=True)
        except Store.DoesNotExist:
            pass


# =============================================================================
# MODEL 2: STORE
# =============================================================================

class Store(BaseModel):
    """
    Seller storefront with slug URL, logo, banner, and status workflow.

    Goes live only after admin approval (status=active).
    """

    seller = models.OneToOneField(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name='store',
        db_index=True,
    )
    university = models.ForeignKey(
        'universities.University',
        on_delete=models.CASCADE,
        related_name='stores',
        db_index=True,
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    description = models.TextField()
    logo_url = models.CharField(max_length=500, blank=True, null=True)
    banner_url = models.CharField(max_length=500, blank=True, null=True)
    store_category = models.CharField(max_length=100)
    return_policy = models.TextField()
    avg_dispatch_hours = models.IntegerField(default=24)
    shipping_coverage = models.TextField(blank=True, null=True)
    business_phone = models.CharField(max_length=20)
    business_email = models.EmailField(max_length=255, blank=True, null=True)
    status = models.CharField(
        max_length=15,
        choices=STORE_STATUS_CHOICES,
        default='draft',
        db_index=True,
    )
    rejection_reason = models.TextField(blank=True, null=True)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.IntegerField(default=0)
    total_sales_count = models.IntegerField(default=0)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_stores',
    )

    class Meta(BaseModel.Meta):
        db_table = 'stores'

    def __str__(self):
        return f'{self.name} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or 'store'
            slug = base
            counter = 1
            while Store.all_objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base}-{uuid.uuid4().hex[:6]}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def _cascade_soft_delete(self):
        # Deactivate all products belonging to this store
        from apps.mall.models import StoreProduct
        now = timezone.now()
        StoreProduct.objects.filter(
            store=self,
            deleted_at__isnull=True
        ).update(
            is_active=False,
            deleted_at=now
        )


# =============================================================================
# MODEL 3: SELLER BADGE
# =============================================================================

class SellerBadge(UUIDMixin, TimestampMixin):
    """
    Badges awarded to stores.

    student_seller badge auto-displays 'Student Seller of {university}'.
    """

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='badges',
        db_index=True,
    )
    badge_type = models.CharField(max_length=20, choices=BADGE_TYPE_CHOICES)
    display_label = models.CharField(max_length=100)
    awarded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    is_active = models.BooleanField(default=True)
    awarded_at = models.DateTimeField(default=timezone.now)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'seller_badges'
        ordering = ['-awarded_at']

    def __str__(self):
        return f'{self.display_label} ({self.badge_type})'

    @classmethod
    def award_student_seller_badge(cls, store):
        """Award the student_seller badge with university name."""
        uni_short = store.seller.user.university.short_name
        label = f'Student Seller of {uni_short}'
        # Deactivate existing student_seller badges
        cls.objects.filter(
            store=store, badge_type='student_seller', is_active=True,
        ).update(is_active=False, revoked_at=timezone.now())
        return cls.objects.create(
            store=store,
            badge_type='student_seller',
            display_label=label,
            awarded_at=timezone.now(),
        )


# =============================================================================
# MODEL 4: SELLER PAYOUT REQUEST
# =============================================================================

class SellerPayoutRequest(BaseModel):
    """Seller payout withdrawal request."""

    seller = models.ForeignKey(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name='payout_requests',
        db_index=True,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=10, choices=PAYOUT_METHOD_CHOICES)
    account_details_snapshot = models.JSONField()
    status = models.CharField(
        max_length=15,
        choices=PAYOUT_STATUS_CHOICES,
        default='pending',
        db_index=True,
    )
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='processed_payouts',
    )
    bank_transaction_ref = models.CharField(max_length=200, blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        db_table = 'seller_payout_requests'

    def __str__(self):
        return f'Payout {self.amount} via {self.method} ({self.status})'


# =============================================================================
# MODEL 5: STUDENT BENEFIT
# =============================================================================

class StudentBenefit(BaseModel):
    """Commission discounts and benefits for student sellers."""

    seller = models.ForeignKey(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name='benefits',
        db_index=True,
    )
    benefit_type = models.CharField(max_length=20, choices=BENEFIT_TYPE_CHOICES)
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
    )
    valid_from = models.DateField()
    valid_until = models.DateField()
    is_active = models.BooleanField(default=True)
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='granted_benefits',
    )

    class Meta(BaseModel.Meta):
        db_table = 'student_benefits'

    def __str__(self):
        return f'{self.benefit_type} for {self.seller.business_name}'
