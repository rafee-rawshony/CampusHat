"""Phase 04 endpoint test script."""
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
from apps.marketplace.models import (
    MarketplaceCategory, MarketplaceProduct, MarketplaceProductImage,
    MarketplaceOffer, MarketplaceChat, MarketplaceMessage,
    MarketplaceReview, MarketplaceReport,
)

# Clean test data thoroughly
MarketplaceProduct.all_objects.all().delete()
MarketplaceCategory.all_objects.all().delete()
MarketplaceOffer.all_objects.all().delete()
MarketplaceChat.all_objects.all().delete()
MarketplaceReview.all_objects.all().delete()
MarketplaceReport.all_objects.all().delete()
User.objects.filter(email__startswith='p4x').delete()

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
    email='p4xs@test.com', full_name='P4 Student',
    university=uni, password='Test@123', is_email_verified=True, role='student',
)
admin_user = User.objects.create_user(
    email='p4xa@test.com', full_name='P4 Admin',
    university=uni, password='Test@123', is_email_verified=True,
    role='admin', is_staff=True,
)
buyer = User.objects.create_user(
    email='p4xb@test.com', full_name='P4 Buyer',
    university=uni, password='Test@123', is_email_verified=True, role='student',
)

# Add verifications
UserVerification.objects.create(
    user=student, verification_type='student_id',
    status='approved', student_id_number='STX1',
)
UserVerification.objects.create(
    user=buyer, verification_type='student_id',
    status='approved', student_id_number='STX2',
)

# Login
s, b = call('POST', '/auth/login/', {'email': 'p4xs@test.com', 'password': 'Test@123'})
student_token = b.get('data', {}).get('access_token', '')
results.append(('1. Student Login', s == 200 and bool(student_token), s))

s, b = call('POST', '/auth/login/', {'email': 'p4xa@test.com', 'password': 'Test@123'})
admin_token = b.get('data', {}).get('access_token', '')
results.append(('2. Admin Login', s == 200 and bool(admin_token), s))

s, b = call('POST', '/auth/login/', {'email': 'p4xb@test.com', 'password': 'Test@123'})
buyer_token = b.get('data', {}).get('access_token', '')
results.append(('3. Buyer Login', s == 200 and bool(buyer_token), s))

# Create category
cat = MarketplaceCategory.objects.create(name='Electronics', ad_type='sell', is_active=True)
results.append(('4. Category Created', bool(cat.slug), cat.slug))

# Categories endpoint
s, b = call('GET', '/marketplace/categories/')
results.append(('5. Categories List', s == 200, s))

# Create product
product = MarketplaceProduct.objects.create(
    user=student, university=uni, category=cat,
    title='Laptop For Sale', description='Great laptop in good condition',
    post_type='sell', price=25000, condition='good',
    is_negotiable=True, campus_visibility='university_only',
    duration_days=15, status='pending',
)
results.append(('6. Product Created (pending)', product.status == 'pending', product.status))

# Public listing (pending = no results)
s, b = call('GET', '/marketplace/listings/')
count = len(b.get('data', {}).get('results', []))
results.append(('7. No Pending in Public', s == 200 and count == 0, count))

# Admin: list pending
s, b = call('GET', '/admin/marketplace/pending/', token=admin_token)
results.append(('8. Admin Pending Queue', s == 200, s))

# Admin: approve
s, b = call('POST', '/admin/marketplace/' + str(product.id) + '/approve/', token=admin_token)
results.append(('9. Admin Approve', s == 200, s))
product.refresh_from_db()
results.append(('10. Status = active', product.status == 'active', product.status))

# Public listing (now active)
s, b = call('GET', '/marketplace/listings/')
count = len(b.get('data', {}).get('results', []))
results.append(('11. Active in Public', s == 200 and count >= 1, count))

# Detail view (increments view_count)
s, b = call('GET', '/marketplace/listings/' + str(product.id) + '/')
results.append(('12. Product Detail', s == 200, s))
product.refresh_from_db()
results.append(('13. View Count +1', product.view_count >= 1, product.view_count))

# My listings
s, b = call('GET', '/marketplace/my-listings/', token=student_token)
results.append(('14. My Listings', s == 200, s))

# Offer
offer = MarketplaceOffer.objects.create(
    product=product, buyer=buyer, offered_price=22000,
)
results.append(('15. Offer Created', offer.status == 'pending', offer.status))

# Chat + Message
chat = MarketplaceChat.objects.create(product=product, buyer=buyer, seller=student)
msg = MarketplaceMessage.objects.create(
    chat=chat, sender=buyer, content='Hi, is this available?',
)
results.append(('16. Chat + Message Created', bool(msg.content), 'OK'))

# Review
review = MarketplaceReview.objects.create(
    product=product, reviewer=buyer, seller=student, rating=5, comment='Great!',
)
results.append(('17. Review Created', review.rating == 5, review.rating))

# Report
report = MarketplaceReport.objects.create(
    product=product, reporter=buyer, reason='spam',
)
results.append(('18. Report Created', report.status == 'pending', report.status))

# Hide
s, b = call('POST', '/marketplace/listings/' + str(product.id) + '/hide/', token=student_token)
results.append(('19. Hide Listing', s == 200, s))
product.refresh_from_db()
results.append(('20. Status = hidden', product.status == 'hidden', product.status))

# Repost
s, b = call('POST', '/marketplace/listings/' + str(product.id) + '/repost/',
            {'duration_days': 30}, token=student_token)
results.append(('21. Repost', s == 200, s))
product.refresh_from_db()
results.append(('22. Status = pending', product.status == 'pending', product.status))

# Auto-expiry task
product.status = 'active'
product.expires_at = timezone.now() - timezone.timedelta(hours=1)
product.is_hidden_by_user = False
product.save(update_fields=['status', 'expires_at', 'is_hidden_by_user'])
from apps.marketplace.tasks import expire_marketplace_posts
count = expire_marketplace_posts()
product.refresh_from_db()
results.append(('23. Auto-Expiry Task', product.status == 'expired', product.status))

# Admin reports queue
s, b = call('GET', '/admin/marketplace/reports/', token=admin_token)
results.append(('24. Admin Reports Queue', s == 200, s))

# Mark sold test
product.status = 'active'
product.expires_at = timezone.now() + timezone.timedelta(days=7)
product.save(update_fields=['status', 'expires_at'])
s, b = call('POST', '/marketplace/listings/' + str(product.id) + '/mark-sold/', token=student_token)
results.append(('25. Mark Sold', s == 200, s))
product.refresh_from_db()
results.append(('26. Status = sold', product.status == 'sold', product.status))

# Print results
print('=' * 60)
print('  PHASE 04 ENDPOINT TEST RESULTS')
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
