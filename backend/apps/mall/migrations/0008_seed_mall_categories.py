"""
Data migration: seed the complete Mall category hierarchy.
Runs exactly once — Django tracks applied migrations.
Idempotent: uses get_or_create so re-running is safe.
"""

from django.db import migrations
from django.utils.text import slugify


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


def _make_slug(name, MallCategory):
    base = slugify(name)
    slug = base
    counter = 1
    while MallCategory.objects.filter(slug=slug).exists():
        slug = f'{base}-{counter}'
        counter += 1
    return slug


def seed_mall_categories(apps, schema_editor):
    MallCategory = apps.get_model('mall', 'MallCategory')

    for main_index, (main_name, icon, children) in enumerate(CATEGORY_TREE, start=1):
        main_cat, _ = MallCategory.objects.get_or_create(
            name=main_name,
            parent=None,
            defaults={
                'slug': _make_slug(main_name, MallCategory),
                'level': 1,
                'icon_url': icon,
                'sort_order': main_index * 10,
                'is_active': True,
            },
        )

        for child_index, child_name in enumerate(children, start=1):
            MallCategory.objects.get_or_create(
                name=child_name,
                parent=main_cat,
                defaults={
                    'slug': _make_slug(child_name, MallCategory),
                    'level': 2,
                    'sort_order': child_index * 10,
                    'is_active': True,
                },
            )


class Migration(migrations.Migration):

    dependencies = [
        ('mall', '0007_cartitem_flash_sale_product'),
    ]

    operations = [
        migrations.RunPython(seed_mall_categories, migrations.RunPython.noop),
    ]
