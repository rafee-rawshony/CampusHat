"""
Verification security & audit upgrade.

- Adds document_hash, cert_hash for duplicate detection (SHA-256).
- Adds is_duplicate_document flag set during submission.
- Adds submission_ip for audit trail.
- Adds attempt_number for re-submission tracking.
- Replaces unique_together(user, verification_type) with a conditional
  UniqueConstraint that only blocks duplicates among active (pending/approved)
  records, so rejection history is preserved.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0008_user_university_email_emailchangerequest'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='userverification',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='userverification',
            name='document_hash',
            field=models.CharField(
                blank=True, db_index=True, max_length=64, null=True,
                help_text='SHA-256 hash of the submitted document for duplicate detection.',
            ),
        ),
        migrations.AddField(
            model_name='userverification',
            name='cert_hash',
            field=models.CharField(
                blank=True, db_index=True, max_length=64, null=True,
                help_text='SHA-256 hash of the enrollment certificate.',
            ),
        ),
        migrations.AddField(
            model_name='userverification',
            name='is_duplicate_document',
            field=models.BooleanField(
                default=False, db_index=True,
                help_text='Flagged True when this document hash matches another user\'s submission.',
            ),
        ),
        migrations.AddField(
            model_name='userverification',
            name='submission_ip',
            field=models.GenericIPAddressField(
                blank=True, null=True,
                help_text='IP address from which this verification was submitted.',
            ),
        ),
        migrations.AddField(
            model_name='userverification',
            name='attempt_number',
            field=models.PositiveIntegerField(
                default=1,
                help_text='Submission attempt count for this user + type combination.',
            ),
        ),
        migrations.AddIndex(
            model_name='userverification',
            index=models.Index(
                fields=['user', 'verification_type', 'status'],
                name='idx_verif_user_type_status',
            ),
        ),
        migrations.AddConstraint(
            model_name='userverification',
            constraint=models.UniqueConstraint(
                fields=['user', 'verification_type'],
                condition=models.Q(status__in=['pending', 'approved']),
                name='uniq_user_type_active_verification',
            ),
        ),
    ]
