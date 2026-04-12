import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.authentication.models import User, UserSession
from apps.universities.models import University
from django.utils import timezone
from datetime import timedelta

import pytest
@pytest.mark.django_db
def test_fix03():
    client = APIClient()

    print("\n=== Test 2.3: Verify HttpOnly refresh token cookie on login ===")
    # Use existing active user or create local admin
    user = User.objects.filter(is_active=True).first()
    if not user:
        uni = University.objects.filter(is_active=True).first()
        user = User.objects.create_user(email='test23@test.com', password='Password123!', full_name='Test', university=uni)
        user.is_email_verified = True
        user.save()
    else:
        # ensuring password is set for test
        user.set_password('Password123!')
        user.save()

    res = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Password123!'}, format='json')
    print(f"Login Status: {res.status_code}")
    if 'refresh_token' not in res.data['data']:
        print("Test 2.3 PASS: refresh_token NOT in response body")
    else:
        print("Test 2.3 FAIL: refresh_token found in body")

    cookies = res.cookies
    if 'refresh_token' in cookies:
        cookie = cookies['refresh_token']
        if cookie.get('httponly'):
            print("Test 2.3 PASS: refresh_token cookie is HttpOnly")
        else:
            print("Test 2.3 FAIL: refresh_token cookie missing HttpOnly")
        
        # Store cookies to test refresh endpoint
        refresh_token_cookie = cookie.value
    else:
        print("Test 2.3 FAIL: refresh_token cookie missing")


    print("\n=== Test 2.6: Test session revocation and Auth block ===")
    access_token = res.data['data']['access_token']
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + access_token)

    # Revoke all sessions natively as simulate logout or force out
    UserSession.objects.filter(user=user).update(revoked=True)

    res2 = client.get('/api/v1/auth/me/')
    print(f"Profile Status after revocation: {res2.status_code}")
    if res2.status_code == 401:
        print("Test 2.6 PASS: Profile block returned 401")
    else:
        print(f"Test 2.6 FAIL: Expected 401, got {res2.status_code}")


    print("\n=== Test 2.7: Cleanup tasks run successfully ===")
    from apps.authentication.tasks import cleanup_expired_sessions
    # create a fake expired
    UserSession.objects.create(
        user=user,
        token_hash='fakexpired',
        device_info='faketest',
        ip_address='127.0.0.1',
        expires_at=timezone.now() - timedelta(days=1)
    )

    result = cleanup_expired_sessions.apply().result
    print(f"Cleanup result: {result}")
    if isinstance(result, dict) and 'expired' in result:
        print("Test 2.7 PASS: cleanup ran correctly")
    else:
        print("Test 2.7 FAIL: cleanup returned unexpected format")
