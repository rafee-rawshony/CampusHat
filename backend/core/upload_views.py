"""
Universal file upload endpoint.

Provides a single, authenticated endpoint that accepts an image upload
and returns its public URL. The URL is what we save on related models
(profile_picture, store.logo, product.image_url, etc.).

Why one endpoint instead of many:
    - DRY: validation, storage backend, naming, security live in one place.
    - Storage swap: dev uses local FileSystemStorage, prod uses S3 — both
      go through the same `default_storage` API.
    - Frontend reuse: the same <ImageUpload /> component talks to a single
      endpoint regardless of which form it lives in.

The endpoint accepts a `category` field (avatar / product / store / banner /
generic) which only affects the storage path. Switching the category does
not change the response shape.
"""

import os
import uuid
from datetime import datetime

from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.validators import validate_image_file


# Logical buckets — keeps uploads organised on disk / S3.
ALLOWED_CATEGORIES = {
    'avatar', 'product', 'store_logo', 'store_banner',
    'banner', 'review', 'generic',
}


class FileUploadView(APIView):
    """
    POST /api/v1/uploads/

    Multipart form data:
        - file (required): the image file
        - category (optional, default 'generic'): one of ALLOWED_CATEGORIES

    Returns:
        201 Created
        { "success": true, "data": { "url": "/media/uploads/...", "path": "uploads/..." } }
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response(
                {'success': False, 'message': 'No file provided.', 'code': 'NO_FILE'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file type + size before storing — same rule as model validators.
        try:
            validate_image_file(upload)
        except Exception as exc:
            return Response(
                {'success': False, 'message': str(exc), 'code': 'INVALID_FILE'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Sanitise the category so the path can't be hijacked via untrusted input.
        category = (request.data.get('category') or 'generic').lower().strip()
        if category not in ALLOWED_CATEGORIES:
            category = 'generic'

        # Build path: uploads/<category>/YYYY/MM/<uuid>.<ext>
        ext = (os.path.splitext(upload.name)[1] or '.jpg').lower()
        if ext not in ('.jpg', '.jpeg', '.png', '.webp'):
            ext = '.jpg'
        now = datetime.utcnow()
        unique_name = uuid.uuid4().hex
        path = os.path.join(
            'uploads', category, str(now.year), f'{now.month:02d}',
            f'{unique_name}{ext}',
        )

        # `default_storage` is local FS in dev, S3 in prod — same API either way.
        saved_path = default_storage.save(path, upload)
        url = default_storage.url(saved_path)

        return Response({
            'success': True,
            'message': 'Upload successful.',
            'data': {
                'url': url,
                'path': saved_path,
                'category': category,
                'size': upload.size,
                'content_type': upload.content_type,
            },
        }, status=status.HTTP_201_CREATED)
