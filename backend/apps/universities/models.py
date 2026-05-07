"""
CampusHat University Models.

University: institutions registered on the platform — each with location,
SSO configuration, and system-generated identifiers.

InstitutionRequest: student-submitted requests for institutions missing
from our seeded list. Admin reviews and either approves (creating a real
University) or rejects.
"""

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from core.models import BaseModel


class University(BaseModel):
    """
    Represents a university registered on the CampusHat platform.

    Each university has a unique system_id (UNIV-00001) auto-generated on save,
    and a slug derived from short_name for URL routing (/campus/{slug}).
    """

    DIVISION_CHOICES = [
        ('Dhaka', 'Dhaka'),
        ('Chittagong', 'Chittagong'),
        ('Rajshahi', 'Rajshahi'),
        ('Khulna', 'Khulna'),
        ('Barisal', 'Barisal'),
        ('Sylhet', 'Sylhet'),
        ('Rangpur', 'Rangpur'),
        ('Mymensingh', 'Mymensingh'),
    ]

    name = models.CharField(
        max_length=200,
        unique=True,
        help_text='Full official name of the university.',
    )
    short_name = models.CharField(
        max_length=30,
        unique=True,
        help_text="Abbreviation, e.g. 'DIU'.",
    )
    slug = models.SlugField(
        max_length=40,
        unique=True,
        blank=True,
        help_text='URL-safe identifier, auto-generated from short_name.',
    )
    system_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        help_text='Auto-generated system ID: UNIV-00001.',
    )
    division = models.CharField(
        max_length=20,
        choices=DIVISION_CHOICES,
        help_text='Administrative division where the university is located.',
    )
    district = models.CharField(
        max_length=80,
        help_text='District name.',
    )
    postal_code = models.CharField(
        max_length=10,
        help_text='Postal code of the university area.',
    )
    full_address = models.TextField(
        help_text='Complete street address of the university.',
    )
    email_domain = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Official email domain for student verification, e.g. 'diu.edu.bd'.",
    )
    short_description = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        help_text='Brief description of the university.',
    )
    logo_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL to the university logo image.',
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text='Whether this university is currently active on the platform.',
    )

    # SSO Configuration
    sso_enabled = models.BooleanField(
        default=False,
        help_text='Whether SSO login is enabled for this university.',
    )
    sso_provider = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="SSO provider type: 'google', 'microsoft', 'saml'.",
    )
    sso_domain = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Email domain for SSO, e.g. '@diu.edu.bd'.",
    )

    class Meta(BaseModel.Meta):
        db_table = 'universities'
        verbose_name = 'University'
        verbose_name_plural = 'Universities'
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug'], name='idx_univ_slug'),
            models.Index(fields=['short_name'], name='idx_univ_short_name'),
            models.Index(fields=['is_active'], name='idx_univ_is_active'),
        ]

    def __str__(self):
        return f'{self.short_name} — {self.name}'

    def save(self, *args, **kwargs):
        """Auto-generate slug and system_id before saving."""
        if not self.slug:
            self.slug = slugify(self.short_name)

        if not self.system_id:
            self.system_id = self._generate_system_id()

        super().save(*args, **kwargs)

    @staticmethod
    def _generate_system_id():
        """
        Generate the next sequential system ID: UNIV-00001, UNIV-00002, etc.
        """
        last = (
            University.all_objects
            .filter(system_id__startswith='UNIV-')
            .order_by('-system_id')
            .values_list('system_id', flat=True)
            .first()
        )
        if last:
            try:
                number = int(last.split('-')[1]) + 1
            except (IndexError, ValueError):
                number = 1
        else:
            number = 1
        return f'UNIV-{number:05d}'


class InstitutionRequest(BaseModel):
    """
    Request to add an institution missing from the seeded University list.

    Submitted by anyone (during student verification) when their college
    isn't in the dropdown. Admin reviews and either approves — which
    creates a University record — or rejects with a reason.
    """

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    name = models.CharField(
        max_length=200,
        help_text='Full official name of the institution.',
    )
    short_name = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        help_text='Optional abbreviation suggested by the requester.',
    )
    division = models.CharField(
        max_length=20,
        choices=University.DIVISION_CHOICES,
        help_text='Division where the institution is located.',
    )
    district = models.CharField(
        max_length=80,
        help_text='District name.',
    )
    full_address = models.TextField(
        blank=True,
        help_text='Best-effort address provided by the requester.',
    )
    website = models.URLField(
        max_length=200,
        blank=True,
        null=True,
        help_text='Institution website (if known).',
    )
    requester_email = models.EmailField(
        blank=True,
        null=True,
        help_text='Optional contact email of the person submitting the request.',
    )
    note = models.TextField(
        blank=True,
        help_text='Free-text note from the requester (e.g. why they need it).',
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
        help_text='Review status of this request.',
    )
    review_note = models.TextField(
        blank=True,
        help_text='Admin note (e.g. reason for rejection).',
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='reviewed_institution_requests',
        blank=True,
        null=True,
        help_text='Admin who approved/rejected this request.',
    )
    reviewed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text='When the request was reviewed.',
    )
    created_university = models.ForeignKey(
        University,
        on_delete=models.SET_NULL,
        related_name='source_requests',
        blank=True,
        null=True,
        help_text='University record created from this request (if approved).',
    )

    class Meta(BaseModel.Meta):
        db_table = 'institution_requests'
        verbose_name = 'Institution Request'
        verbose_name_plural = 'Institution Requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status'], name='idx_inst_req_status'),
        ]

    def __str__(self):
        return f'{self.name} ({self.status})'
