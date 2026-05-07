# Manually written migration adding the InstitutionRequest model.
# Tracks student-submitted requests for institutions missing from the
# seeded University list. Admin reviews and either approves (creating a
# University) or rejects.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('universities', '0002_email_domain_and_extend_lengths'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='InstitutionRequest',
            fields=[
                (
                    'id',
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text='Unique identifier for this record.',
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    'created_at',
                    models.DateTimeField(
                        auto_now_add=True,
                        db_index=True,
                        help_text='When this record was created.',
                    ),
                ),
                (
                    'updated_at',
                    models.DateTimeField(
                        auto_now=True,
                        help_text='When this record was last updated.',
                    ),
                ),
                (
                    'deleted_at',
                    models.DateTimeField(
                        blank=True,
                        db_index=True,
                        default=None,
                        help_text='When this record was soft-deleted. NULL means active.',
                        null=True,
                    ),
                ),
                (
                    'name',
                    models.CharField(
                        help_text='Full official name of the institution.',
                        max_length=200,
                    ),
                ),
                (
                    'short_name',
                    models.CharField(
                        blank=True,
                        help_text='Optional abbreviation suggested by the requester.',
                        max_length=30,
                        null=True,
                    ),
                ),
                (
                    'division',
                    models.CharField(
                        choices=[
                            ('Dhaka', 'Dhaka'),
                            ('Chittagong', 'Chittagong'),
                            ('Rajshahi', 'Rajshahi'),
                            ('Khulna', 'Khulna'),
                            ('Barisal', 'Barisal'),
                            ('Sylhet', 'Sylhet'),
                            ('Rangpur', 'Rangpur'),
                            ('Mymensingh', 'Mymensingh'),
                        ],
                        help_text='Division where the institution is located.',
                        max_length=20,
                    ),
                ),
                (
                    'district',
                    models.CharField(help_text='District name.', max_length=80),
                ),
                (
                    'full_address',
                    models.TextField(
                        blank=True,
                        help_text='Best-effort address provided by the requester.',
                    ),
                ),
                (
                    'website',
                    models.URLField(
                        blank=True,
                        help_text='Institution website (if known).',
                        max_length=200,
                        null=True,
                    ),
                ),
                (
                    'requester_email',
                    models.EmailField(
                        blank=True,
                        help_text='Optional contact email of the person submitting the request.',
                        max_length=254,
                        null=True,
                    ),
                ),
                (
                    'note',
                    models.TextField(
                        blank=True,
                        help_text='Free-text note from the requester (e.g. why they need it).',
                    ),
                ),
                (
                    'status',
                    models.CharField(
                        choices=[
                            ('pending', 'Pending'),
                            ('approved', 'Approved'),
                            ('rejected', 'Rejected'),
                        ],
                        db_index=True,
                        default='pending',
                        help_text='Review status of this request.',
                        max_length=10,
                    ),
                ),
                (
                    'review_note',
                    models.TextField(
                        blank=True,
                        help_text='Admin note (e.g. reason for rejection).',
                    ),
                ),
                (
                    'reviewed_at',
                    models.DateTimeField(
                        blank=True,
                        help_text='When the request was reviewed.',
                        null=True,
                    ),
                ),
                (
                    'created_university',
                    models.ForeignKey(
                        blank=True,
                        help_text='University record created from this request (if approved).',
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='source_requests',
                        to='universities.university',
                    ),
                ),
                (
                    'reviewed_by',
                    models.ForeignKey(
                        blank=True,
                        help_text='Admin who approved/rejected this request.',
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='reviewed_institution_requests',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'Institution Request',
                'verbose_name_plural': 'Institution Requests',
                'db_table': 'institution_requests',
                'ordering': ['-created_at'],
                'abstract': False,
                'indexes': [
                    models.Index(fields=['status'], name='idx_inst_req_status'),
                ],
            },
        ),
    ]
