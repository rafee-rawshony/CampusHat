import magic
from django.core.exceptions import ValidationError

MAX_IMAGE_SIZE_MB = 5
MAX_DOC_SIZE_MB = 10

ALLOWED_IMAGE_MIMES = {'image/jpeg', 'image/png', 'image/webp'}
ALLOWED_DOC_MIMES = {'application/pdf', 'image/jpeg', 'image/png'}

def validate_image_file(file):
    # Size check
    if file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            f'Image must be under {MAX_IMAGE_SIZE_MB}MB. '
            f'You uploaded {file.size / 1024 / 1024:.1f}MB.'
        )
    # MIME check
    mime = magic.from_buffer(file.read(2048), mime=True)
    file.seek(0)
    if mime not in ALLOWED_IMAGE_MIMES:
        raise ValidationError(
            f'Invalid file type: {mime}. '
            f'Only JPEG, PNG, and WebP images are allowed.'
        )

def validate_document_file(file):
    if file.size > MAX_DOC_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            f'Document must be under {MAX_DOC_SIZE_MB}MB.'
        )
    mime = magic.from_buffer(file.read(2048), mime=True)
    file.seek(0)
    if mime not in ALLOWED_DOC_MIMES:
        raise ValidationError(
            f'Invalid file type: {mime}. Only PDF, JPEG, PNG allowed.'
        )
