import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.models import User
from apps.universities.models import University

import pytest
@pytest.mark.django_db
def test_fix02():
    client = APIClient()

    # Set up test data
    uni, _ = University.objects.get_or_create(
        name='Test Uni Fix 02',
        short_name='TU02',
        defaults={
            'division': 'Dhaka',
            'district': 'Dhaka',
            'postal_code': '1000',
            'full_address': 'Test Address',
            'is_active': True
        }
    )
    uni.is_active = True
    uni.save()

    payload = {
        'email': f'testuser02_fix02@test.com',
        'password': 'Password123!',
        'full_name': 'Test User 02',
        'university_id': str(uni.id)
    }
    User.objects.filter(email=payload['email']).delete()

    print("\n=== Test 1: Register new user. Check role='normal_user' ===")
    res1 = client.post('/api/v1/auth/register/', payload, format='json')
    print(f"Status: {res1.status_code}")
    print(f"Response: {res1.data}")
    if res1.status_code == 201:
        assert res1.data['data']['role'] == 'normal_user', "Role is not normal_user"
        print("Test 1 PASS")
    else:
        print("Test 1 FAIL")

    # Setup for Test 2: User must be verified to login natively, but we can bypass for test
    user = User.objects.get(email=payload['email'])
    user.is_email_verified = True
    user.save()

    res_login = client.post('/api/v1/auth/login/', {'email': payload['email'], 'password': payload['password']}, format='json')
    token = res_login.data['data']['access_token']
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

    print("\n=== Test 2: PATCH /auth/me/update/ with body {role: 'admin'} ===")
    res2 = client.patch('/api/v1/auth/me/update/', {'role': 'admin'}, format='json')
    print(f"Status: {res2.status_code}")
    user.refresh_from_db()
    print(f"Role after PATCH: {user.role}")
    if user.role == 'normal_user':
        print("Test 2 PASS")
    else:
        print("Test 2 FAIL")

    client.credentials() # reset

    print("\n=== Setup for Test 3 & 4 ===")
    user2_payload = {
        'email': f'unverified02_fix02@test.com',
        'password': 'Password123!',
        'full_name': 'Unverified 02',
        'university_id': str(uni.id)
    }
    User.objects.filter(email=user2_payload['email']).delete()
    client.post('/api/v1/auth/register/', user2_payload, format='json')

    user2 = User.objects.get(email=user2_payload['email'])
    # Manually mint token for unverified user (since login blocks it, but the view requires auth)
    refresh = RefreshToken.for_user(user2)
    unverified_token = str(refresh.access_token)

    client.credentials(HTTP_AUTHORIZATION='Bearer ' + unverified_token)

    print("\n=== Test 3: POST /auth/resend-verification/ for unverified user ===")
    res3 = client.post('/api/v1/auth/resend-verification/')
    print(f"Status: {res3.status_code}")
    print(f"Response: {res3.data}")
    if res3.status_code == 200:
        print("Test 3 PASS")
    else:
        print("Test 3 FAIL")

    print("\n=== Test 4: POST /auth/resend-verification/ for verified user ===")
    user2.is_email_verified = True
    user2.save()

    res4 = client.post('/api/v1/auth/resend-verification/')
    print(f"Status: {res4.status_code}")
    print(f"Response: {res4.data}")
    if res4.status_code == 400:
        print("Test 4 PASS")
    else:
        print("Test 4 FAIL")

    print("\nAll tests completed.")
