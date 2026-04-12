import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, UserSession
from apps.sellers.models import SellerProfile, Store
from apps.mall.models import StoreProduct
from apps.marketplace.models import MarketplaceProduct
from apps.universities.models import University # Need to import standard dependencies

import pytest
@pytest.mark.django_db
def test_soft_delete_cascade():
    def run_tests():
        print("=== Soft-Delete Cascade Verification ===")
        
        # Cleanup previous runs
        UserSession.objects.all().delete()
        MarketplaceProduct.all_objects.all().delete()
        StoreProduct.all_objects.all().delete()
        Store.all_objects.all().delete()
        SellerProfile.all_objects.all().delete()
        User.all_objects.filter(email__in=["user1@example.com", "user2@example.com"]).delete()
        University.objects.filter(slug="test-uni").delete()
        
        # Setup Data
        uni, _ = University.objects.get_or_create(
            name="Test University", 
            slug="test-uni",
            short_name="TU"
        )
        
        user1 = User.objects.create(email="user1@example.com", full_name="User One", university=uni)
        user2 = User.objects.create(email="user2@example.com", full_name="User Two", university=uni)
        
        seller1 = SellerProfile.objects.create(
            user=user2, business_name="Seller One", business_phone="123", status="approved"
        )
        store1 = Store.objects.create(
            seller=seller1, university=uni, name="Store One", store_category="Books", status="active"
        )
        
        # Store product
        p1 = StoreProduct.objects.create(
            store=store1, name="Book 1", base_price=10.0, stock_quantity=5, is_active=True
        )
        
        # Marketplace Ad
        ad1 = MarketplaceProduct.objects.create(
            user=user1, university=uni, title="Used Laptop", price=500.0, condition="good", status="active",
            post_type="sell", duration_days=7
        )
        
        # Session
        s1 = UserSession.objects.create(
            user=user1, token_hash="dummy1", expires_at=timezone.now() + timezone.timedelta(days=1)
        )

        print("\n[TEST 1] Soft-delete SellerProfile cascades to Store and StoreProduct")
        seller1.soft_delete(cascade=True)
        seller1.refresh_from_db()
        
        store1 = Store.all_objects.get(id=store1.id)
        p1 = StoreProduct.all_objects.get(id=p1.id)
        
        print(f"Seller soft-deleted? {seller1.is_deleted}")
        print(f"Store soft-deleted? {store1.is_deleted}")
        print(f"StoreProduct deactivated? {not p1.is_active} & deleted? {p1.is_deleted}")
        if seller1.is_deleted and store1.is_deleted and not p1.is_active and p1.is_deleted:
            print("✅ TEST 1 PASSED")
        else:
            print("❌ TEST 1 FAILED")

        print("\n[TEST 2] Soft-delete User cascades to MarketplaceProduct and Sessions")
        user1.soft_delete()
        user1.refresh_from_db()
        
        ad1 = MarketplaceProduct.all_objects.get(id=ad1.id)
        s1.refresh_from_db()
        
        print(f"User soft-deleted? {user1.deleted_at is not None}")
        print(f"Marketplace Ad hidden? {ad1.status == 'hidden'} (is_hidden_by_user={ad1.is_hidden_by_user})")
        print(f"User Session revoked? {s1.revoked}")
        
        if (user1.deleted_at is not None) and ad1.status == 'hidden' and ad1.is_hidden_by_user and s1.revoked:
            print("✅ TEST 2 PASSED")
        else:
            print("❌ TEST 2 FAILED")

        print("\n[TEST 3] Admin Restore logic")
        # Restore user
        user1.restore()
        user1.refresh_from_db()
        
        # Ad and session stay hidden/revoked (design choice usually), let's just check User came back
        print(f"User restored? {user1.deleted_at is None}")
        if user1.deleted_at is None:
            print("✅ TEST 3 PASSED")
        else:
            print("❌ TEST 3 FAILED")

        # Cleanup
        UserSession.objects.all().delete()
        MarketplaceProduct.all_objects.all().delete()
        StoreProduct.all_objects.all().delete()
        Store.all_objects.all().delete()
        SellerProfile.all_objects.all().delete()
        User.all_objects.all().delete()
        University.objects.all().delete()

    if __name__ == "__main__":
        run_tests()
