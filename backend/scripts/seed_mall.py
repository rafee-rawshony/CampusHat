"""
Seed script: Add Demo Mall Products, Categories, and a default Store to the CampusHat Mall.
Run: docker exec campushat_backend python manage.py shell < seed_mall.py
Or locally: python seed_mall.py  (if pipenv shell is active)
"""

import django
import os
import random
from decimal import Decimal

# Boot Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.universities.models import University
from apps.sellers.models import SellerProfile, Store
from apps.mall.models import MallCategory, StoreProduct, StoreProductImage, ProductVariant

User = get_user_model()

def seed_mall():
    print("=== STARTING MALL SEEDING ===")

    # 1. Ensure University
    uni, _ = University.objects.get_or_create(
        short_name="DEMO",
        defaults={"name": "Demo University", "division": "Dhaka", "district": "Dhaka", "is_active": True}
    )

    # 2. Ensure User
    user, _ = User.objects.get_or_create(
        email="mall_seller@campushat.com",
        defaults={
            "full_name": "Mall Seeder",
            "university": uni,
            "role": "seller",
            "is_active": True,
            "is_email_verified": True
        }
    )
    user.set_password("campushat123")
    user.save()

    # 3. Ensure SellerProfile
    profile, _ = SellerProfile.objects.get_or_create(
        user=user,
        defaults={
            "business_name": "CampusHat Official Electronics",
            "business_type": "brand",
            "status": "approved",
            "business_phone": "01700000000",
            "is_student_seller": False
        }
    )

    # 4. Ensure Store
    store, _ = Store.objects.get_or_create(
        seller=profile,
        defaults={
            "name": "TechHub AU",
            "slug": "techhub-au",
            "university": uni,
            "description": "The best tech store on campus.",
            "store_category": "Electronics",
            "return_policy": "7 day return policy.",
            "business_phone": "01700000000",
            "status": "active"
        }
    )

    # 5. Create Mall Categories
    electronics, _ = MallCategory.objects.get_or_create(
        slug="electronics",
        defaults={"name": "Electronics", "level": 1, "is_active": True}
    )
    audio, _ = MallCategory.objects.get_or_create(
        slug="audio",
        defaults={"name": "Audio & Headphones", "parent": electronics, "level": 2, "is_active": True}
    )
    wearables, _ = MallCategory.objects.get_or_create(
        slug="wearables",
        defaults={"name": "Wearables", "parent": electronics, "level": 2, "is_active": True}
    )
    study, _ = MallCategory.objects.get_or_create(
        slug="study-materials",
        defaults={"name": "Study Materials", "level": 1, "is_active": True}
    )

    categories = [audio, wearables, study]

    # 6. Create Dummy Products
    products_data = [
        {
            "name": "Premium Wireless Over-Ear Headphones",
            "slug": "premium-wireless-headphones-anc",
            "category": audio,
            "description": "<p>Experience studio-quality sound with our premium wireless headphones. Designed specifically for long study sessions.</p><ul><li>Up to 40 hours battery life</li><li>Active Noise Cancellation (ANC)</li></ul>",
            "base_price": Decimal("2500.00"),
            "discount_price": Decimal("1990.00"),
            "stock_quantity": 45,
            "has_variants": True,
            "is_featured": True,
            "tags": ["audio", "headphones", "anc"],
            "images": [
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800&auto=format&fit=crop"
            ],
            "variants": [
                {"name": "Midnight Black", "sku": "HP-BLK", "price_override": Decimal("1990.00"), "stock_quantity": 25, "attributes": {"Color": "Black"}},
                {"name": "Lunar Silver", "sku": "HP-SLV", "price_override": Decimal("2100.00"), "stock_quantity": 20, "attributes": {"Color": "Gray"}},
            ]
        },
        {
            "name": "Smart Fitness Band Pro",
            "slug": "smart-fitness-band-pro",
            "category": wearables,
            "description": "<p>Track your steps to class and monitor your sleep during exams.</p>",
            "base_price": Decimal("1500.00"),
            "discount_price": None,
            "stock_quantity": 100,
            "has_variants": False,
            "is_featured": False,
            "tags": ["fitness", "wearables", "smartwatch"],
            "images": [
                "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?q=80&w=800&auto=format&fit=crop"
            ],
            "variants": []
        },
        {
            "name": "Engineering Drawing Kit Set",
            "slug": "engineering-drawing-kit",
            "category": study,
            "description": "<p>Complete drafting set for 1st year engineering students. Includes T-square, compasses, and mechanical pencils.</p>",
            "base_price": Decimal("850.00"),
            "discount_price": Decimal("750.00"),
            "stock_quantity": 5,
            "has_variants": False,
            "is_featured": True,
            "tags": ["engineering", "drawing", "kit"],
            "images": [
                "https://images.unsplash.com/photo-1588691522066-cdca631168cb?q=80&w=800&auto=format&fit=crop"
            ],
            "variants": []
        },
        {
            "name": "Wireless Ergonomic Mouse",
            "slug": "wireless-ergonomic-mouse",
            "category": electronics,
            "description": "<p>Prevent wrist strain during long coding sessions.</p>",
            "base_price": Decimal("1200.00"),
            "discount_price": Decimal("950.00"),
            "stock_quantity": 0, # OUT OF STOCK
            "has_variants": False,
            "is_featured": False,
            "tags": ["mouse", "electronics", "ergonomic"],
            "images": [
                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop"
            ],
            "variants": []
        }
    ]

    added = 0
    for pdata in products_data:
        prod, created = StoreProduct.objects.get_or_create(
            slug=pdata["slug"],
            defaults={
                "store": store,
                "category": pdata["category"],
                "name": pdata["name"],
                "description": pdata["description"],
                "base_price": pdata["base_price"],
                "discount_price": pdata["discount_price"],
                "stock_quantity": pdata["stock_quantity"],
                "has_variants": pdata["has_variants"],
                "is_featured": pdata["is_featured"],
                "tags": pdata["tags"],
                "is_active": True,
                "rating_avg": round(random.uniform(3.5, 5.0), 1),
                "review_count": random.randint(10, 150),
                "sold_count": random.randint(5, 500)
            }
        )

        if created:
            added += 1
            # Add Images
            for idx, img_url in enumerate(pdata["images"]):
                StoreProductImage.objects.create(
                    product=prod,
                    image_url=img_url,
                    sort_order=idx,
                    is_primary=(idx == 0)
                )

            # Add Variants
            if pdata["has_variants"]:
                for vdata in pdata["variants"]:
                    ProductVariant.objects.create(
                        product=prod,
                        name=vdata["name"],
                        sku=vdata["sku"],
                        price_override=vdata["price_override"],
                        stock_quantity=vdata["stock_quantity"],
                        attributes=vdata["attributes"],
                        is_active=True
                    )
            
            print(f"✓ Added Product: {prod.name}")
        else:
            print(f"Skipped Product (already exists): {prod.name}")

    print(f"\n✅ Done. Added {added} completely new products (total {StoreProduct.objects.count()} mall products).")

if __name__ == "__main__":
    seed_mall()
