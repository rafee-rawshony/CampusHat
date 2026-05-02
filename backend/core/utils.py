"""
CampusHat Shared Utilities.

Helper functions used across multiple apps for generating IDs,
file paths, and sending emails.
"""

import logging
import os
import random
import string
import uuid
from datetime import datetime

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


# =============================================================================
# ID & CODE GENERATORS
# =============================================================================

def generate_order_number() -> str:
    """
    Generate a unique order number.

    Format: ORD-YYYY-NNNNN
    Example: ORD-2026-48291
    """
    year = datetime.now().year
    number = random.randint(10000, 99999)
    return f'ORD-{year}-{number}'


def generate_invoice_number() -> str:
    """
    Generate a unique invoice number.

    Format: INV-YYYY-NNNNN
    Example: INV-2026-73651
    """
    year = datetime.now().year
    number = random.randint(10000, 99999)
    return f'INV-{year}-{number}'


def generate_tracking_code() -> str:
    """
    Generate a unique tracking code for shipments.

    Format: CH-TRK-XXXXXXXX (8 uppercase alphanumeric chars)
    Example: CH-TRK-A3F9K2M7
    """
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f'CH-TRK-{code}'


def generate_store_system_id() -> str:
    """
    Generate a unique system ID for a seller's store.

    Format: STORE-NNNNN
    Example: STORE-00142
    """
    number = random.randint(10000, 99999)
    return f'STORE-{number}'


def generate_unique_slug(text: str, model_class, field: str = 'slug') -> str:
    """
    Generate a unique slug from text, appending a short UUID suffix
    if the slug already exists.

    Args:
        text: The text to slugify.
        model_class: The Django model class to check uniqueness against.
        field: The field name to check for uniqueness (default: 'slug').

    Returns:
        A unique slug string.
    """
    from django.utils.text import slugify

    base_slug = slugify(text)[:200]
    slug = base_slug

    # Check if slug already exists, append suffix if needed
    counter = 1
    while model_class.objects.filter(**{field: slug}).exists():
        suffix = uuid.uuid4().hex[:6]
        slug = f'{base_slug}-{suffix}'
        counter += 1
        if counter > 10:
            slug = f'{base_slug}-{uuid.uuid4().hex[:12]}'
            break

    return slug


# =============================================================================
# FILE UPLOAD PATH
# =============================================================================

def get_file_upload_path(instance, filename: str) -> str:
    """
    Generate a dynamic upload path for files.

    Organizes uploads by model name, date, and a UUID filename
    to prevent collisions and maintain structure.

    Path format: uploads/<model_name>/YYYY/MM/<uuid>.<ext>
    Example: uploads/product/2026/03/a1b2c3d4.jpg

    Args:
        instance: The model instance the file is being uploaded to.
        filename: The original filename.

    Returns:
        The generated file path.
    """
    ext = filename.split('.')[-1].lower() if '.' in filename else 'bin'
    model_name = instance.__class__.__name__.lower()
    now = datetime.now()
    unique_name = uuid.uuid4().hex[:12]
    return os.path.join(
        'uploads',
        model_name,
        str(now.year),
        f'{now.month:02d}',
        f'{unique_name}.{ext}',
    )


# =============================================================================
# EMAIL
# =============================================================================

def send_notification_email(
    to: str | list[str],
    subject: str,
    template: str,
    context: dict | None = None,
) -> bool:
    """
    Send a templated notification email.

    Args:
        to: Recipient email address(es).
        subject: Email subject line.
        template: Path to the email template (e.g., 'emails/welcome.html').
        context: Template context dictionary.

    Returns:
        True if the email was sent successfully, False otherwise.
    """
    if context is None:
        context = {}

    if isinstance(to, str):
        to = [to]

    # Add common context
    context.setdefault('site_url', getattr(settings, 'SITE_URL', ''))
    context.setdefault('frontend_url', getattr(settings, 'FRONTEND_URL', ''))

    try:
        html_message = render_to_string(template, context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=to,
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.error('send_notification_email failed | to=%s subject=%s error=%s', to, subject, exc)
        return False
