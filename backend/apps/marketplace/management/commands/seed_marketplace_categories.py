"""
Seed the complete Marketplace category hierarchy.

3-level structure:
  - Main Category = ad_type field (sell, rent, service, food)
  - Category = root level (parent=null)
  - Subcategory = child of a category (parent=category)

Usage: python manage.py seed_marketplace_categories
       python manage.py seed_marketplace_categories --clear
"""

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.marketplace.models import MarketplaceCategory


CATEGORY_DATA = {
    'sell': {
        'Electronics': [
            'Smartphones', 'Laptops & Computers', 'Tablets', 'Smart Watches',
            'Headphones & Earbuds', 'Cameras', 'Gaming Consoles', 'Monitors',
            'Printers', 'Routers', 'Keyboards & Mouse', 'Power Banks',
            'Pendrives & Hard Disks', 'Speakers', 'Scientific Calculators',
            'Electronic Accessories',
        ],
        'Furniture & Room Essentials': [
            'Study Table', 'Computer Table', 'Chair', 'Bookshelf', 'Bed',
            'Mattress', 'Pillow', 'Wardrobe', 'Drawer', 'Shoe Rack',
            'Mirror', 'Table Lamp', 'Fan', 'Cloth Hanger', 'Storage Box',
        ],
        'Fashion & Lifestyle': [
            "Men's Clothing", "Women's Clothing", 'Shoes', 'Bags', 'Watches',
            'Jewelry', 'Sunglasses', 'Cosmetics & Skincare', 'Perfume',
        ],
        'Home & Living': [
            'Furniture', 'Home Decor', 'Kitchen Appliances', 'Lighting',
            'Bedding', 'Bathroom Accessories', 'Storage Items', 'Rice Cooker',
            'Electric Kettle', 'Induction Cooker', 'Blender', 'Mini Fridge',
            'Iron', 'Water Filter', 'Kitchen Utensils',
        ],
        'Books & Study Materials': [
            'Academic Books', 'Semester Books', 'Admission Books', 'Story Books',
            'Notes & PDFs', 'Stationery', 'Lab Equipment', 'Lab Manuals',
            'Drawing Tools',
        ],
        'Sports & Outdoor': [
            'Gym Equipment', 'Sports Gear', 'Bicycles', 'Outdoor Accessories',
            'Gaming Accessories',
        ],
        'Vehicles': [
            'Bikes', 'Cars', 'Vehicle Parts', 'Helmets & Safety Gear',
            'Bike Accessories',
        ],
        'Musical Instruments': [
            'Guitar', 'Keyboard', 'Drums', 'Audio Equipment',
        ],
        'Pets & Accessories': [
            'Pet Food', 'Pet Accessories', 'Pet Care Products',
        ],
        'Others': [
            'Gift Items', 'Collectibles', 'Handmade Products',
            'Decoration Items', 'Travel Bags', 'Backpacks',
            'Cameras & Tripods', 'Projectors',
        ],
    },
    'rent': {
        'Room & Accommodation': [
            'Room Rent', 'Seat Rent', 'Flat/Sublet', 'Hostel Seat',
            'Shared Room', 'Roommate Finder',
        ],
        'Study & Academic': [
            'Semester Books', 'Admission Books', 'Lab Equipment',
            'Scientific Calculator', 'Drawing Board', 'Project Materials',
        ],
        'Electronics Rent': [
            'Laptop', 'Desktop Computer', 'Tablet', 'Monitor', 'Projector',
            'Camera', 'DSLR Camera', 'Gaming Console',
        ],
        'Transport': [
            'Bicycle', 'Bike',
        ],
        'Event & Presentation Items': [
            'Tripod', 'Microphone', 'Sound Box', 'Lighting Equipment',
        ],
        'Others': [],
    },
    'service': {
        'Academic & Education': [
            'Home Tutoring', 'Group Tutoring', 'Assignment Help', 'Project Help',
            'Thesis Assistance', 'Lab Report Help', 'Research Assistance',
            'Notes Sharing', 'Academic Consultancy', 'Course Guideline',
            'Programming Help', 'Database Design Help',
        ],
        'Writing & Documentation': [
            'Content Writing', 'Copywriting', 'Translation Service',
            'CV/Resume Writing',
        ],
        'Design & Creative': [
            'Graphic Design', 'UI/UX Design', 'Logo Design',
            'Presentation Design', 'Handmade Craft Service',
        ],
        'Development & Technology': [
            'Web Development', 'App Development', 'Tech Support',
            'Laptop Repair', 'Mobile Repair',
        ],
        'Media & Production': [
            'Video Editing', 'Photography', 'Voice Over Service',
        ],
        'Marketing & Online Services': [
            'Social Media Management', 'Digital Marketing', 'SEO Service',
            'Data Entry',
        ],
        'Career & Professional': [
            'Career Mentorship', 'Public Speaking Coaching',
            'Online Form Fill-up',
        ],
        'Printing & Event Services': [
            'Printing & Photocopy', 'Event Management', 'Delivery Service',
        ],
        'Lifestyle & Personal': [
            'Fitness Training', 'Makeup Service', 'Gaming Coaching',
        ],
    },
    'food': {
        'Homemade Food': [
            'Bengali Food', 'Meal Box', 'Homemade Snacks', 'Healthy Food',
            'Student Meal Package',
        ],
        'Bakery & Desserts': [
            'Cake', 'Pastry', 'Bakery Items', 'Cookies', 'Brownies',
            'Cupcakes',
        ],
        'Beverages': [
            'Tea', 'Coffee', 'Juice', 'Homemade Drinks',
        ],
        'Fast Food': [
            'Burger', 'Sandwich', 'Pizza', 'Fried Chicken',
        ],
        'Meal System': [
            'Daily Meal Service', 'Weekly Meal Package', 'Monthly Meal Package',
            'Lunch Package', 'Dinner Package', 'Hostel Meal Service',
        ],
        'Others': [
            'Custom Food Orders', 'Event Food Supply', 'Seasonal Food Items',
        ],
    },
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
                parent_cat, created = MarketplaceCategory.objects.get_or_create(
                    name=cat_name,
                    ad_type=ad_type,
                    parent=None,
                    defaults={
                        'slug': _make_unique_slug(ad_type, cat_name),
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
