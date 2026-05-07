"""Seed the CampusHat Mall category hierarchy."""

from django.core.management.base import BaseCommand

from apps.mall.models import MallCategory


CATEGORY_TREE = [
    ('Electronics', 'Monitor', [
        'Mobile Phones', 'Laptops', 'Desktop PC', 'Monitors', 'Tablets',
        'Smart Watches', 'Headphones / Earbuds', 'Cameras', 'Accessories',
    ]),
    ('Computers & Accessories', 'Laptop', [
        'Laptop', 'Desktop PC', 'Monitor', 'Keyboard', 'Mouse', 'Printer',
        'Storage (SSD, HDD, Pen Drive)', 'Networking (Router, LAN cable)',
    ]),
    ('Fashion & Clothing', 'Shirt', [
        "Men's Clothing", "Women's Clothing", 'Shoes', 'Bags', 'Watches',
        'Accessories',
    ]),
    ('Books & Study Materials', 'BookOpen', [
        'Academic Books', 'Story / Novel', 'Admission Books', 'Notes',
        'Stationery',
    ]),
    ('Home & Living', 'Home', [
        'Room Decor', 'Lighting', 'Furniture', 'Kitchen Items', 'Bedding',
    ]),
    ('Beauty & Personal Care', 'Sparkles', [
        'Skincare', 'Haircare', 'Grooming', 'Perfume',
    ]),
    ('Sports & Fitness', 'Dumbbell', [
        'Gym Equipment', 'Sports Gear', 'Outdoor Items',
    ]),
    ('Food & Snacks', 'Utensils', [
        'Packaged Food', 'Homemade Food', 'Beverages',
    ]),
    ('Services', 'Wrench', [
        'Printing', 'Repair', 'Freelance',
    ]),
    ('Others', 'Package', [
        'Miscellaneous',
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
