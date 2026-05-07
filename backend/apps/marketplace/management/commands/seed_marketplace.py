import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.authentication.models import User, UserVerification
from apps.marketplace.models import (
    MarketplaceCategory, MarketplaceProduct, MarketplaceProductImage
)
from apps.universities.models import University


class Command(BaseCommand):
    help = 'Seeds the database with marketplace dummy data for testing.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database with Marketplace demo data...')

        # 1. Create Universities
        diu, _ = University.objects.get_or_create(
            short_name='DIU',
            defaults={
                'name': 'Daffodil International University',
                'division': 'Dhaka',
                'district': 'Dhaka',
                'postal_code': '1207',
                'full_address': 'Daffodil Smart City, Ashulia',
                'is_active': True
            }
        )
        brac, _ = University.objects.get_or_create(
            short_name='BRACU',
            defaults={
                'name': 'BRAC University',
                'division': 'Dhaka',
                'district': 'Dhaka',
                'postal_code': '1212',
                'full_address': '66 Mohakhali, Dhaka',
                'is_active': True
            }
        )
        universities = [diu, brac]

        # 2. Create Users
        users = []
        for i in range(1, 6):
            obj, created = User.objects.get_or_create(
                email=f'student{i}@example.com',
                defaults={
                    'full_name': f'Student User {i}',
                    'university': random.choice(universities),
                    'role': 'student',
                    'is_active': True,
                    'is_email_verified': True,
                    'phone': f'+880190000000{i}',
                    'reputation_score': round(random.uniform(3.5, 5.0), 1),
                }
            )
            if created:
                obj.set_password('password123')
                obj.save()
                
                # Make them verified
                UserVerification.objects.create(
                    user=obj,
                    verification_type='student_id',
                    status='approved',
                    student_id_number=f'STU-00{i}'
                )
            users.append(obj)

        # 3. Create Categories
        categories_data = {
            'sell': ['Electronics', 'Books', 'Fashion', 'Furniture', 'Accessories'],
            'rent': ['Apartments', 'Vehicles', 'Event Gear', 'Electronics', 'Books'],
            'service': ['Tutoring', 'Graphic Design', 'Photography', 'Repair', 'errands'],
            'food': ['Snacks', 'Meals', 'Beverages', 'Desserts', 'Baking']
        }
        
        category_objects = {}
        for ad_type, cats in categories_data.items():
            category_objects[ad_type] = []
            for idx, cname in enumerate(cats):
                cat, _ = MarketplaceCategory.objects.get_or_create(
                    name=cname,
                    ad_type=ad_type,
                    defaults={'sort_order': idx, 'is_active': True}
                )
                category_objects[ad_type].append(cat)

        # 4. Create Products
        self.stdout.write('Creating products...')
        titles = {
            'sell': ['iPhone 13 Pro', 'Engineering Math TextBook', 'NIKE Sneakers', 'Study Table', 'Mechanical Keyboard', 'Samsung Monitor', 'Acoustic Guitar'],
            'rent': ['2 BHK Flat Near Campus', 'Pulsar NS160 for Rent', 'DSLR Camera (Weekend)', 'Speaker System for Party', 'Projector for Presentation'],
            'service': ['Python Programming Tutor', 'UI/UX Design Services', 'Thesis Paper Proofreading', 'Laptop Repair Service', 'Event Photographer'],
            'food': ['Homemade Brownies', 'Spicy Fried Rice Pack', 'Fresh Lemonade', 'Chicken Burger Combo', 'Custom Birthday Cake']
        }
        descriptions = "This is a detailed description for the item. It is highly reliable and perfect for university students. Check the details attached."

        images_library = [
            'https://placehold.co/800x600/E5E5E5/1A1A2E.png?text=Photo+1',
            'https://placehold.co/800x600/F0F0F0/2C3E50.png?text=Photo+2',
            'https://placehold.co/800x600/EEEEEE/8E44AD.png?text=Photo+3',
        ]

        conditions = ['like_new', 'good', 'fair']
        
        for ad_type in ['sell', 'rent', 'service', 'food']:
            # Create ~15 products per type
            for i in range(15):
                cat = random.choice(category_objects[ad_type])
                title = random.choice(titles[ad_type]) + f" #{random.randint(100, 999)}"
                price = Decimal(random.randint(100, 5000))
                
                # set correct durations
                duration = random.choice([7, 15, 30]) if ad_type in ['sell', 'rent'] else random.choice([30, 90, 180])

                product = MarketplaceProduct.objects.create(
                    user=random.choice(users),
                    university=random.choice(universities),
                    category=cat,
                    title=title,
                    description=descriptions + f"\n\nExtra info #{i}",
                    post_type=ad_type,
                    price=price,
                    price_unit='month' if ad_type == 'rent' else ('hour' if ad_type == 'service' else None),
                    condition=random.choice(conditions) if ad_type == 'sell' else None,
                    status='active',
                    duration_days=duration,
                    safe_meetup_location='Campus Main Gate',
                    view_count=random.randint(10, 500)
                )

                # Add some images randomly, sometimes 0, sometimes 1, sometimes 3
                num_images = random.choice([0, 1, 2, 3])
                for j in range(num_images):
                    MarketplaceProductImage.objects.create(
                        product=product,
                        image_url=images_library[j],
                        sort_order=j,
                        is_primary=(j == 0)
                    )

        self.stdout.write(self.style.SUCCESS('Successfully seeded marketplace data!'))
