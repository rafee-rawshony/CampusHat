"""Seed the CampusHat Mall category hierarchy."""

from django.core.management.base import BaseCommand

from apps.mall.models import MallCategory


CATEGORY_TREE = [
    ('Electronics', 'Monitor', [
        'Smartphones', 'Laptops & Computers', 'Tablets', 'Smart Watches',
        'Headphones & Earbuds', 'Cameras', 'Gaming Consoles', 'Monitors',
        'Printers', 'Routers', 'Keyboards & Mouse', 'Power Banks',
        'Pendrives & Hard Disks', 'Speakers', 'Scientific Calculators',
        'Electronic Accessories',
    ]),
    ('Fashion & Lifestyle', 'Shirt', [
        "Men's Clothing", "Women's Clothing", 'Shoes', 'Bags', 'Watches',
        'Jewelry', 'Sunglasses', 'Cosmetics & Skincare', 'Perfume',
    ]),
    ('Home & Living', 'Home', [
        'Furniture', 'Home Decor', 'Kitchen Appliances', 'Lighting',
        'Bedding', 'Bathroom Accessories', 'Storage Items', 'Rice Cooker',
        'Electric Kettle', 'Induction Cooker', 'Blender', 'Mini Fridge',
        'Iron', 'Water Filter', 'Kitchen Utensils',
    ]),
    ('Books & Study Materials', 'BookOpen', [
        'Academic Books', 'Semester Books', 'Admission Books', 'Story Books',
        'Notes & PDFs', 'Stationery', 'Lab Equipment', 'Lab Manuals',
        'Drawing Tools',
    ]),
    ('Sports & Outdoor', 'Dumbbell', [
        'Gym Equipment', 'Sports Gear', 'Bicycles', 'Outdoor Accessories',
        'Gaming Accessories',
    ]),
    ('Vehicles & Accessories', 'Car', [
        'Bikes', 'Cars', 'Vehicle Parts', 'Helmets & Safety Gear',
        'Bike Accessories',
    ]),
    ('Musical Instruments', 'Music', [
        'Guitar', 'Keyboard', 'Drums', 'Audio Equipment',
    ]),
    ('Pets & Accessories', 'PawPrint', [
        'Pet Food', 'Pet Accessories', 'Pet Care Products',
    ]),
    ('Snacks & Dry Food', 'Utensils', [
        'Chips & Snacks', 'Chocolates', 'Biscuits & Cookies',
        'Instant Noodles', 'Dry Cakes', 'Soft Drinks', 'Juice',
        'Energy Drinks',
    ]),
    ('Others', 'Package', [
        'Gift Items', 'Collectibles', 'Handmade Products',
        'Decoration Items', 'Travel Bags', 'Backpacks',
        'Cameras & Tripods', 'Projectors',
    ]),
]


class Command(BaseCommand):
    help = 'Seed the MallCategory table with the CampusHat Mall hierarchy.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing mall categories before seeding.',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = MallCategory.all_objects.all().delete()[0]
            self.stdout.write(self.style.WARNING(f'Deleted {count} categories.'))

        created_count = 0
        updated_count = 0

        for main_index, (main_name, icon, children) in enumerate(CATEGORY_TREE, start=1):
            main_cat, created = MallCategory.objects.get_or_create(
                name=main_name,
                parent=None,
                defaults={
                    'level': 1,
                    'icon_url': icon,
                    'sort_order': main_index * 10,
                    'is_active': True,
                },
            )
            if created:
                created_count += 1

            updates = {}
            if main_cat.icon_url != icon:
                updates['icon_url'] = icon
            if main_cat.sort_order != main_index * 10:
                updates['sort_order'] = main_index * 10
            if not main_cat.is_active:
                updates['is_active'] = True
            if updates:
                for field, value in updates.items():
                    setattr(main_cat, field, value)
                main_cat.save(update_fields=[*updates.keys(), 'updated_at'])
                updated_count += 1

            for child_index, child_name in enumerate(children, start=1):
                _, child_created = MallCategory.objects.get_or_create(
                    name=child_name,
                    parent=main_cat,
                    defaults={
                        'level': 2,
                        'sort_order': child_index * 10,
                        'is_active': True,
                    },
                )
                if child_created:
                    created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Done! Created {created_count} categories, updated {updated_count}.'
            )
        )
