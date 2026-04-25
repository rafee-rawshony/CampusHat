import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.validators import sanitize_html
from apps.marketplace.interaction_serializers import SendMessageSerializer, MarketplaceReviewSerializer
from apps.authentication.models import User
from apps.marketplace.models import MarketplaceChat, MarketplaceProduct, MarketplaceCategory
from apps.universities.models import University

import pytest
@pytest.mark.django_db
def test_xss_sanitization():
    def test_sanitizer():
        print("=== XSS Sanitization Test ===")
        
        malicious_payload = '<script>alert("XSS")</script><b>BoldText</b><a href="javascript:alert(1)">Link</a><p onmouseover="alert(1)">Paragraph</p>'
        sanitized = sanitize_html(malicious_payload)
        
        print(f"Original: {malicious_payload}")
        print(f"Sanitized: {sanitized}")
        
        if '<script>' not in sanitized and 'onmouseover' not in sanitized and 'javascript:' not in sanitized and '<b>BoldText</b>' in sanitized:
            print("✅ Bleach HTML Core validation passes!")
        else:
            print("❌ Core validation failed!")

        print("\nSerializer Layer Test (SendMessageSerializer)...")
        
        payload = {
            'message_type': 'text',
            'content': malicious_payload
        }
        
        serializer = SendMessageSerializer(data=payload)
        if serializer.is_valid():
            content = serializer.validated_data.get('content')
            if '<script>' not in content and '<b>BoldText</b>' in content:
                print("✅ Serializer validate_content passes!")
            else:
                print("❌ Serializer validation failed to scrub!")
        else:
            print(f"Serializer error: {serializer.errors}")

    if __name__ == "__main__":
        test_sanitizer()
