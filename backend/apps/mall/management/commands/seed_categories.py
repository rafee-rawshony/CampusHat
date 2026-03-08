"""
Seed Mall Categories.

Populates the MallCategory table with the platform's category hierarchy:
Electronics, Fashion, Cosmetics, Food, Books, Home, Sports, Campus Services.
"""

from django.core.management.base import BaseCommand

from apps.mall.models import MallCategory


CATEGORY_TREE = {
    'Electronics': {
        'icon': '🔌',
        'children': {
            'Mobile Phones': {
                'children': ['Smartphones', 'Feature Phones', 'Phone Accessories'],
            },
            'Laptops & Computers': {
                'children': ['Laptops', 'Desktops', 'Computer Accessories', 'Monitors'],
            },
            'Audio & Headphones': {
                'children': ['Earphones', 'Headphones', 'Speakers', 'Microphones'],
            },
            'Cameras & Photography': {
                'children': ['DSLR Cameras', 'Mirrorless', 'Action Cameras', 'Lenses'],
            },
            'Gaming': {
                'children': ['Gaming Consoles', 'Gaming Accessories', 'PC Gaming'],
            },
            'Wearables': {
                'children': ['Smartwatches', 'Fitness Trackers', 'Smart Glasses'],
            },
        },
    },
    'Fashion': {
        'icon': '👕',
        'children': {
            "Men's Clothing": {
                'children': ['T-Shirts', 'Shirts', 'Jeans', 'Jackets', 'Traditional Wear'],
            },
            "Women's Clothing": {
                'children': ['Tops', 'Dresses', 'Sarees', 'Salwar Kameez', 'Kurtis'],
            },
            'Footwear': {
                'children': ['Sneakers', 'Sandals', 'Formal Shoes', 'Sports Shoes'],
            },
            'Bags & Wallets': {
                'children': ['Backpacks', 'Handbags', 'Wallets', 'Laptop Bags'],
            },
            'Jewelry & Accessories': {
                'children': ['Watches', 'Sunglasses', 'Belts', 'Jewelry'],
            },
        },
    },
    'Cosmetics & Personal Care': {
        'icon': '💄',
        'children': {
            'Skincare': {
                'children': ['Face Wash', 'Moisturizer', 'Sunscreen', 'Serum'],
            },
            'Makeup': {
                'children': ['Foundation', 'Lipstick', 'Eye Makeup', 'Nail Polish'],
            },
            'Hair Care': {
                'children': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Styling'],
            },
            'Fragrances': {
                'children': ['Perfumes', 'Body Sprays', 'Deodorants'],
            },
        },
    },
    'Food & Beverages': {
        'icon': '🍔',
        'children': {
            'Snacks': {
                'children': ['Chips', 'Biscuits', 'Nuts', 'Chocolates'],
            },
            'Beverages': {
                'children': ['Tea', 'Coffee', 'Juice', 'Energy Drinks'],
            },
            'Home Cooking': {
                'children': ['Spices', 'Rice', 'Oil', 'Instant Food'],
            },
            'Campus Food': {
                'children': ['Meal Plans', 'Tiffin Service', 'Catering'],
            },
        },
    },
    'Books & Stationery': {
        'icon': '📚',
        'children': {
            'Academic Books': {
                'children': ['Engineering', 'Medical', 'Business', 'Science', 'Arts'],
            },
            'Fiction & Non-Fiction': {
                'children': ['Novels', 'Self-Help', 'Biography', 'Comics'],
            },
            'Stationery': {
                'children': ['Notebooks', 'Pens', 'Art Supplies', 'Calculators'],
            },
            'Digital Content': {
                'children': ['E-Books', 'Online Courses', 'Software Licenses'],
            },
        },
    },
    'Home & Living': {
        'icon': '🏠',
        'children': {
            'Dorm Essentials': {
                'children': ['Bedding', 'Storage', 'Lighting', 'Curtains'],
            },
            'Kitchen': {
                'children': ['Utensils', 'Appliances', 'Water Bottles', 'Lunch Boxes'],
            },
            'Decor': {
                'children': ['Wall Art', 'Plants', 'Rugs', 'Organizers'],
            },
        },
    },
    'Sports & Fitness': {
        'icon': '⚽',
        'children': {
            'Cricket': {
                'children': ['Bats', 'Balls', 'Pads', 'Gloves'],
            },
            'Football': {
                'children': ['Footballs', 'Boots', 'Jerseys', 'Shin Guards'],
            },
            'Fitness': {
                'children': ['Gym Equipment', 'Yoga Mats', 'Resistance Bands', 'Dumbbells'],
            },
            'Outdoor': {
                'children': ['Tents', 'Hiking Gear', 'Water Sports', 'Cycling'],
            },
        },
    },
    'Campus Services': {
        'icon': '🎓',
        'children': {
            'Tutoring': {
                'children': ['Math Tutoring', 'Science Tutoring', 'Language Tutoring', 'Test Prep'],
            },
            'Tech Services': {
                'children': ['Laptop Repair', 'Phone Repair', 'Software Installation', 'Data Recovery'],
            },
            'Creative Services': {
                'children': ['Graphic Design', 'Photography', 'Video Editing', 'Content Writing'],
            },
            'Academic Help': {
                'children': ['Assignment Help', 'Project Assistance', 'Presentation Design', 'Resume Writing'],
            },
        },
    },
}


class Command(BaseCommand):
    help = 'Seed the MallCategory table with the platform category hierarchy.'

    def handle(self, *args, **options):
        created_count = 0
        sort_order = 0

        for main_name, main_data in CATEGORY_TREE.items():
            sort_order += 10
            main_cat, created = MallCategory.objects.get_or_create(
                name=main_name,
                defaults={
                    'level': 1,
                    'parent': None,
                    'sort_order': sort_order,
                    'is_active': True,
                },
            )
            if created:
                created_count += 1

            sub_sort = 0
            for sub_name, sub_data in main_data.get('children', {}).items():
                sub_sort += 10
                sub_cat, created = MallCategory.objects.get_or_create(
                    name=sub_name,
                    parent=main_cat,
                    defaults={
                        'level': 2,
                        'sort_order': sub_sort,
                        'is_active': True,
                    },
                )
                if created:
                    created_count += 1

                subsub_sort = 0
                for subsub_name in sub_data.get('children', []):
                    subsub_sort += 10
                    _, created = MallCategory.objects.get_or_create(
                        name=subsub_name,
                        parent=sub_cat,
                        defaults={
                            'level': 3,
                            'sort_order': subsub_sort,
                            'is_active': True,
                        },
                    )
                    if created:
                        created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Done! Created {created_count} categories.'
            )
        )
