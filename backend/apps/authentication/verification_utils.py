"""
Helpers for verification document handling.

- compute_file_hash: SHA-256 hash of an UploadedFile (streamed, never loads
  the whole file into memory).
- strip_image_metadata: removes EXIF + other ancillary metadata from JPEG/PNG
  images, returning an in-memory file-like object that mimics the original
  Django UploadedFile interface.
- extract_client_ip: trustable IP extraction respecting proxy headers.
"""

import hashlib
import io
import logging
import os

from django.core.files.uploadedfile import SimpleUploadedFile

logger = logging.getLogger(__name__)

HASH_CHUNK_SIZE = 64 * 1024  # 64 KB

IMAGE_MIMES = {'image/jpeg', 'image/png'}


def compute_file_hash(file_obj) -> str:
    """
    Compute SHA-256 hex digest of an uploaded file by streaming.

    Resets the file pointer to position 0 both before and after reading
    so the caller can use the file again afterwards.
    """
    sha = hashlib.sha256()

    try:
        file_obj.seek(0)
    except (AttributeError, OSError):
        pass

    while True:
        chunk = file_obj.read(HASH_CHUNK_SIZE)
        if not chunk:
            break
        sha.update(chunk)

    try:
        file_obj.seek(0)
    except (AttributeError, OSError):
        pass

    return sha.hexdigest()


def strip_image_metadata(file_obj):
    """
    Strip EXIF and ancillary metadata from a JPEG or PNG upload.

    Returns either:
      - A new SimpleUploadedFile carrying the cleaned image bytes, OR
      - The original file_obj if the file is not an image / stripping fails.

    Never raises — falls back to the original file on any error.
    """
    content_type = getattr(file_obj, 'content_type', '') or ''
    if content_type not in IMAGE_MIMES:
        return file_obj

    try:
        from PIL import Image
    except ImportError:
        logger.warning('Pillow not installed; skipping EXIF strip.')
        return file_obj

    try:
        file_obj.seek(0)
        with Image.open(file_obj) as img:
            # Rebuild the image from raw pixel data — drops EXIF, ICC, XMP, etc.
            data = list(img.getdata())
            clean = Image.new(img.mode, img.size)
            clean.putdata(data)

            out = io.BytesIO()
            if content_type == 'image/jpeg':
                # Preserve a sensible quality and force RGB so JPEGs save cleanly.
                if clean.mode != 'RGB':
                    clean = clean.convert('RGB')
                clean.save(out, format='JPEG', quality=92, optimize=True)
            else:
                clean.save(out, format='PNG', optimize=True)

            out.seek(0)
            original_name = getattr(file_obj, 'name', 'upload')
            base, ext = os.path.splitext(original_name)
            ext = ext or ('.jpg' if content_type == 'image/jpeg' else '.png')
            return SimpleUploadedFile(
                name=f'{base}{ext}',
                content=out.read(),
                content_type=content_type,
            )
    except Exception as exc:
        logger.warning(f'EXIF strip failed, using original file: {exc}')
        try:
            file_obj.seek(0)
        except (AttributeError, OSError):
            pass
        return file_obj


def extract_client_ip(request) -> str | None:
    """
    Pull the originating client IP from a DRF/Django request.

    Honours X-Forwarded-For (first hop = the originating client when the
    reverse proxy is trusted). Falls back to REMOTE_ADDR.
    """
    if request is None:
        return None
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if xff:
        first = xff.split(',')[0].strip()
        if first:
            return first
    return request.META.get('REMOTE_ADDR') or None
