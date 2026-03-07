"""
CampusHat University Model.

Stores university data including location, SSO configuration, and
system-generated identifiers for URL routing and internal tracking.
"""

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
        max_length=20,
        unique=True,
        help_text="Abbreviation, e.g. 'DIU'.",
    )
    slug = models.SlugField(
        max_length=25,
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
