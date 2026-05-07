"""
Seed the complete Marketplace category hierarchy.

3-level structure:
  - Main Category = ad_type field (sell, rent, service, food)
  - Category = root level (parent=null)
  - Subcategory = child of a category (parent=category)

Usage: python manage.py seed_marketplace_categories
"""

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.marketplace.models import MarketplaceCategory


# Complete category structure per ad_type
CATEGORY_DATA = {
    'sell': {
        'Electronics': [
            'Smartphones', 'Laptops', 'Desktop PCs', 'Tablets',
            'Smart Watches', 'Headphones & Earbuds', 'Cameras',
            'Gaming Consoles', 'Computer Accessories', 'Mobile Accessories',
            'Networking Devices', 'Printers & Scanners',
        ],
        'Gaming': [
            'Gaming PCs', 'Gaming Accessories', 'Console Games',
            'Gaming Chairs', 'Gaming Accounts', 'Gaming Peripherals',
        ],
        'Books & Study Materials': [
            'Academic Books', 'Admission Books', 'Notes & PDFs',
            'Research Papers', 'Story Books', 'Magazines', 'Stationery',
        ],
        'Fashion & Lifestyle': [
            'Men\'s Clothing', 'Women\'s Clothing', 'Shoes', 'Bags',
            'Watches', 'Jewelry', 'Sunglasses', 'Cosmetics',
        ],
        'Home & Living': [
            'Furniture', 'Home Decor', 'Kitchen Items',
            'Appliances', 'Lighting', 'Bedding',
        ],
        'Vehicles & Transport': [
            'Bicycles', 'Motorcycles', 'Car Accessories',
            'Helmets', 'Vehicle Parts',
        ],
        'Health & Personal Care': [
            'Fitness Equipment', 'Supplements', 'Personal Care Products',
        ],
        'Pets & Accessories': [
            'Pet Food', 'Pet Accessories', 'Pet Adoption',
        ],
        'Musical Instruments': [
            'Guitars', 'Keyboards', 'Drums', 'Audio Equipment',
        ],
        'Others': [
            'Collectibles', 'Gift Items', 'Miscellaneous Products',
        ],
    },
    'rent': {
        'Accommodation': [
            'Hostel Seat', 'Flat / Apartment', 'Sublet',
            'Room Sharing', 'Paying Guest (PG)',
        ],
        'Vehicle Rental': [
            'Bicycle Rental', 'Motorcycle Rental', 'Car Rental',
        ],
        'Electronics Rental': [
            'Laptop Rental', 'Camera Rental',
            'Projector Rental', 'Gaming Console Rental',
        ],
        'Event & Equipment Rental': [
            'Sound System', 'Decoration Equipment',
            'Lighting Equipment', 'Photography Equipment',
        ],
        'Fashion Rental': [
            'Dress Rental', 'Costume Rental',
        ],
        'Academic Rental': [
            'Book Rental', 'Calculator Rental',
        ],
    },
    'service': {
        'Education & Tutoring': [
            'Home Tutoring', 'Online Tutoring', 'Assignment Help',
            'Project Assistance', 'Language Learning',
        ],
        'Tech Services': [
            'Web Development', 'App Development', 'Graphic Design',
            'Video Editing', 'UI/UX Design', 'Cyber Security Help',
            'PC Servicing', 'Software Installation',
        ],
        'Creative Services': [
            'Photography', 'Videography', 'Content Writing',
            'Social Media Management',
        ],
        'Delivery & Moving': [
            'Parcel Delivery', 'Moving Assistance',
        ],
        'Home Services': [
            'Cleaning Service', 'Repair Service',
        ],
        'Freelance & Professional': [
            'CV Writing', 'Translation', 'Data Entry', 'Digital Marketing',
        ],
        'Food Related Services': [
            'Catering', 'Homemade Food Service', 'Event Food Service',
        ],
    },
    'food': {
        'Fast Food': [
            'Burgers', 'Pizza', 'Sandwiches', 'Fried Chicken',
        ],
        'Meals & Rice Items': [
            'Lunch Packages', 'Dinner Packages', 'Biriyani', 'Khichuri',
        ],
        'Snacks & Street Food': [
            'Fuchka', 'Chotpoti', 'Rolls', 'Fries',
        ],
        'Drinks & Beverages': [
            'Tea', 'Coffee', 'Soft Drinks', 'Juices', 'Smoothies',
        ],
        'Desserts & Bakery': [
            'Cakes', 'Pastries', 'Cookies', 'Ice Cream',
        ],
        'Healthy Food': [
            'Diet Meals', 'Salads', 'Protein Meals',
        ],
        'Homemade Food': [
            'Homemade Lunch', 'Homemade Dinner', 'Tiffin Service',
        ],
        'Event Food': [
            'Party Food', 'Catering Packages',
        ],
    },
}

# Icon mapping for categories
ICON_MAP = {
    'Electronics': 'https://img.icons8.com/fluency/48/smartphone.png',
    'Gaming': 'https://img.icons8.com/fluency/48/game-controller.png',
    'Books & Study Materials': 'https://img.icons8.com/fluency/48/book.png',
    'Fashion & Lifestyle': 'https://img.icons8.com/fluency/48/t-shirt.png',
    'Home & Living': 'https://img.icons8.com/fluency/48/home.png',
    'Vehicles & Transport': 'https://img.icons8.com/fluency/48/bicycle.png',
    'Health & Personal Care': 'https://img.icons8.com/fluency/48/heart-health.png',
    'Pets & Accessories': 'https://img.icons8.com/fluency/48/cat-footprint.png',
    'Musical Instruments': 'https://img.icons8.com/fluency/48/guitar.png',
    'Others': 'https://img.icons8.com/fluency/48/box.png',
    'Accommodation': 'https://img.icons8.com/fluency/48/home.png',
    'Vehicle Rental': 'https://img.icons8.com/fluency/48/car.png',
    'Electronics Rental': 'https://img.icons8.com/fluency/48/laptop.png',
    'Event & Equipment Rental': 'https://img.icons8.com/fluency/48/party-baloons.png',
    'Fashion Rental': 'https://img.icons8.com/fluency/48/dress.png',
    'Academic Rental': 'https://img.icons8.com/fluency/48/book.png',
    'Education & Tutoring': 'https://img.icons8.com/fluency/48/graduation-cap.png',
    'Tech Services': 'https://img.icons8.com/fluency/48/source-code.png',
    'Creative Services': 'https://img.icons8.com/fluency/48/camera.png',
    'Delivery & Moving': 'https://img.icons8.com/fluency/48/delivery.png',
    'Home Services': 'https://img.icons8.com/fluency/48/broom.png',
    'Freelance & Professional': 'https://img.icons8.com/fluency/48/briefcase.png',
    'Food Related Services': 'https://img.icons8.com/fluency/48/cooking-pot.png',
    'Fast Food': 'https://img.icons8.com/fluency/48/hamburger.png',
    'Meals & Rice Items': 'https://img.icons8.com/fluency/48/rice-bowl.png',
    'Snacks & Street Food': 'https://img.icons8.com/fluency/48/french-fries.png',
    'Drinks & Beverages': 'https://img.icons8.com/fluency/48/coffee-cup.png',
    'Desserts & Bakery': 'https://img.icons8.com/fluency/48/cake.png',
    'Healthy Food': 'https://img.icons8.com/fluency/48/salad.png',
    'Homemade Food': 'https://img.icons8.com/fluency/48/cooking-pot.png',
    'Event Food': 'https://img.icons8.com/fluency/48/party-baloons.png',
}


def _make_unique_slug(ad_type, name, exclude_pk=None):
    """Generate a unique slug for a category."""
    base_slug = slugify(f'{ad_type}-{name}')
    slug = base_slug
    counter = 1
    qs = MarketplaceCategory.all_objects.filter(slug=slug)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    while qs.exists():
        slug = f'{base_slug}-{counter}'
        counter += 1
        qs = MarketplaceCategory.all_objects.filter(slug=slug)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
    return slug


class Command(BaseCommand):
    help = 'Seeds the complete marketplace category hierarchy (Buy & Sell, Rental, Services, Food).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing marketplace categories before seeding.',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = MarketplaceCategory.all_objects.all().delete()[0]
            self.stdout.write(self.style.WARNING(f'Deleted {count} existing category records.'))

        total_created = 0
        total_existing = 0

        for ad_type, categories in CATEGORY_DATA.items():
            self.stdout.write(f'\n  [{ad_type.upper()}]')

            for cat_order, (cat_name, subcategories) in enumerate(categories.items()):
                # Create or get root category
                parent_cat, created = MarketplaceCategory.objects.get_or_create(
                    name=cat_name,
                    ad_type=ad_type,
                    parent=None,
                    defaults={
                        'slug': _make_unique_slug(ad_type, cat_name),
                        'icon_url': ICON_MAP.get(cat_name),
                        'sort_order': cat_order,
                        'is_active': True,
                    }
                )

                if created:
                    total_created += 1
                    self.stdout.write(f'    + {cat_name}')
                else:
                    total_existing += 1
                    self.stdout.write(f'    = {cat_name} (exists)')

                # Create subcategories
                for sub_order, sub_name in enumerate(subcategories):
                    sub_cat, sub_created = MarketplaceCategory.objects.get_or_create(
                        name=sub_name,
                        ad_type=ad_type,
                        parent=parent_cat,
                        defaults={
                            'slug': _make_unique_slug(ad_type, sub_name),
                            'sort_order': sub_order,
                            'is_active': True,
                        }
                    )

                    if sub_created:
                        total_created += 1
                    else:
                        total_existing += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done! Created: {total_created}, Already existed: {total_existing}, '
            f'Total: {total_created + total_existing}'
        ))
