"""Phase 05 endpoint test script."""
import os
import json
import urllib.request
import urllib.error

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.development'
import django
django.setup()

from django.utils import timezone
from apps.authentication.models import User, UserVerification
from apps.universities.models import University
from apps.sellers.models import (
    SellerProfile, Store, SellerBadge, SellerPayoutRequest, StudentBenefit,
)

import pytest
@pytest.mark.django_db
def test_phase05():
    # Clean
    SellerPayoutRequest.all_objects.all().delete()
    SellerBadge.objects.all().delete()
    Store.all_objects.all().delete()
    StudentBenefit.all_objects.all().delete()
    SellerProfile.all_objects.all().delete()
    User.objects.filter(email__startswith='p5x').delete()

    uni = University.objects.first()
    base = 'http://localhost:8000/api/v1'
    results = []


    def call(method, path, data=None, token=None):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = 'Bearer ' + token
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(
            base + path, data=body, headers=headers, method=method,
        )
        try:
            r = urllib.request.urlopen(req)
            return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())


    # Create users
    student = User.objects.create_user(
        email='p5xs@test.com', full_name='P5 Student Seller',
        university=uni, password='Test@123', is_email_verified=True, role='student',
    )
    admin_user = User.objects.create_user(
        email='p5xa@test.com', full_name='P5 Admin',
        university=uni, password='Test@123', is_email_verified=True,
        role='admin', is_staff=True,
    )
    # Add verification for student
    UserVerification.objects.get_or_create(
        user=student, defaults={
            'verification_type': 'student_id',
            'status': 'approved',
            'student_id_number': 'STU-P5',
        },
    )

    # Login
    s, b = call('POST', '/auth/login/', {'email': 'p5xs@test.com', 'password': 'Test@123'})
    student_token = b.get('data', {}).get('access_token', '')
    results.append(('1. Student Login', s == 200 and bool(student_token), s))

    s, b = call('POST', '/auth/login/', {'email': 'p5xa@test.com', 'password': 'Test@123'})
    admin_token = b.get('data', {}).get('access_token', '')
    results.append(('2. Admin Login', s == 200 and bool(admin_token), s))

    # Create SellerProfile via ORM (multipart upload too complex for urllib)
    seller = SellerProfile.objects.create(
        user=student,
        business_name='Student Tech Store',
        business_type='student',
        nid_number='12345678',
        nid_front_url='/media/test/nid_front.jpg',
        nid_back_url='/media/test/nid_back.jpg',
        business_phone='01712345678',
        business_email='seller@test.com',
        mobile_banking_method='bkash',
        is_student_seller=True,
        commission_rate=7.00,
        status='pending',
    )
    # Encrypt mobile number
    seller.set_mobile_number('01712345678')
    seller.set_bank_details({'bank_name': 'City Bank', 'account_no': '123456789'})
    seller.save()
    results.append(('3. SellerProfile Created', seller.status == 'pending', seller.status))

    # Verify encryption works
    decrypted_mobile = seller.get_mobile_number()
    results.append(('4. Encryption Works', decrypted_mobile == '01712345678', decrypted_mobile))
    bank = seller.get_bank_details()
    results.append(('5. Bank Details Encrypted', bank.get('bank_name') == 'City Bank', str(bank)))

    # My profile
    s, b = call('GET', '/sellers/my-profile/', token=student_token)
    results.append(('6. My Profile', s == 200, s))

    # Admin: pending sellers
    s, b = call('GET', '/admin/sellers/pending/', token=admin_token)
    results.append(('7. Admin Pending Sellers', s == 200, s))

    # Admin: seller detail
    s, b = call('GET', '/admin/sellers/' + str(seller.id) + '/', token=admin_token)
    results.append(('8. Admin Seller Detail', s == 200, s))

    # Admin: approve seller
    s, b = call('POST', '/admin/sellers/' + str(seller.id) + '/approve/', token=admin_token)
    results.append(('9. Admin Approve Seller', s == 200, s))
    seller.refresh_from_db()
    results.append(('10. Seller Approved', seller.status == 'approved', seller.status))

    # Dashboard (requires approved seller)
    s, b = call('GET', '/sellers/my-dashboard/', token=student_token)
    results.append(('11. Seller Dashboard', s == 200, s))

    # Create Store via ORM
    store = Store.objects.create(
        seller=seller, university=uni,
        name='Student Tech Hub',
        description='Best tech products for students',
        store_category='Electronics',
        return_policy='7 day return policy',
        business_phone='01712345678',
        status='draft',
    )
    results.append(('12. Store Created', store.status == 'draft', store.slug))

    # Submit store for review
    s, b = call('POST', '/stores/my-store/submit-for-review/', token=student_token)
    results.append(('13. Submit for Review', s == 200, s))
    store.refresh_from_db()
    results.append(('14. Store Under Review', store.status == 'under_review', store.status))

    # Admin: pending stores
    s, b = call('GET', '/admin/stores/pending/', token=admin_token)
    results.append(('15. Admin Pending Stores', s == 200, s))

    # Admin: approve store
    s, b = call('POST', '/admin/stores/' + str(store.id) + '/approve/', token=admin_token)
    results.append(('16. Admin Approve Store', s == 200, s))
    store.refresh_from_db()
    results.append(('17. Store Active', store.status == 'active', store.status))

    # Check student seller badge was awarded
    badge = SellerBadge.objects.filter(
        store=store, badge_type='student_seller', is_active=True,
    ).first()
    results.append(('18. Student Badge Awarded', badge is not None, getattr(badge, 'display_label', 'NONE')))

    # Public store list
    s, b = call('GET', '/stores/')
    results.append(('19. Public Store List', s == 200, s))

    # Public store detail
    s, b = call('GET', '/stores/' + store.slug + '/')
    results.append(('20. Public Store Detail', s == 200, s))

    # My store
    s, b = call('GET', '/stores/my-store/', token=student_token)
    results.append(('21. My Store', s == 200, s))

    # Payout request
    payout = SellerPayoutRequest.objects.create(
        seller=seller, amount=1000, method='bkash',
        account_details_snapshot={'method': 'bkash', 'number': '01712345678'},
    )
    results.append(('22. Payout Created', payout.status == 'pending', payout.status))

    # Admin: process payout
    s, b = call('POST', '/admin/payouts/' + str(payout.id) + '/process/',
                {'bank_transaction_ref': 'TXN-001'}, token=admin_token)
    results.append(('23. Admin Process Payout', s == 200, s))
    payout.refresh_from_db()
    results.append(('24. Payout Completed', payout.status == 'completed', payout.status))

    # Admin: award badge
    s, b = call('POST', '/admin/stores/' + str(store.id) + '/badges/award/',
                {'badge_type': 'fast_dispatch'}, token=admin_token)
    results.append(('25. Admin Award Badge', s == 201, s))

    # Admin: revoke badge
    fast_badge = SellerBadge.objects.filter(
        store=store, badge_type='fast_dispatch', is_active=True,
    ).first()
    if fast_badge:
        s, b = call('POST', '/admin/stores/' + str(store.id) + '/badges/' + str(fast_badge.id) + '/revoke/',
                    token=admin_token)
        results.append(('26. Admin Revoke Badge', s == 200, s))
        fast_badge.refresh_from_db()
        results.append(('27. Badge Revoked', not fast_badge.is_active, fast_badge.is_active))
    else:
        results.append(('26. Admin Revoke Badge', False, 'badge not found'))
        results.append(('27. Badge Revoked', False, 'N/A'))

    # StudentBenefit
    benefit = StudentBenefit.objects.create(
        seller=seller, benefit_type='commission_discount',
        discount_percentage=3.00,
        valid_from=timezone.now().date(),
        valid_until=(timezone.now() + timezone.timedelta(days=90)).date(),
        granted_by=admin_user,
    )
    results.append(('28. Student Benefit Created', benefit.is_active, benefit.benefit_type))

    # Print results
    print('=' * 60)
    print('  PHASE 05 ENDPOINT TEST RESULTS')
    print('=' * 60)
    all_pass = True
    for name, passed, extra in results:
        icon = 'PASS' if passed else 'FAIL'
        print('  [{}] {} ({})'.format(icon, name, extra))
        if not passed:
            all_pass = False
    print('=' * 60)
    if all_pass:
        print('  ALL TESTS PASSED!')
    else:
        print('  SOME TESTS FAILED')
    print('=' * 60)
