"""
Data migration: clear old marketplace categories and seed the complete hierarchy.
Runs exactly once — Django tracks applied migrations.
"""

from django.db import migrations
from django.utils.text import slugify


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


def _make_unique_slug(MarketplaceCategory, ad_type, name):
    base_slug = slugify(f'{ad_type}-{name}')
    slug = base_slug
    counter = 1
    while MarketplaceCategory.objects.filter(slug=slug).exists():
        slug = f'{base_slug}-{counter}'
        counter += 1
    return slug


def seed_categories(apps, schema_editor):
    MarketplaceCategory = apps.get_model('marketplace', 'MarketplaceCategory')

    # Delete all existing marketplace categories
    MarketplaceCategory.objects.all().delete()

    for ad_type, categories in CATEGORY_DATA.items():
        for cat_order, (cat_name, subcategories) in enumerate(categories.items()):
            parent_cat = MarketplaceCategory.objects.create(
                name=cat_name,
                slug=_make_unique_slug(MarketplaceCategory, ad_type, cat_name),
                ad_type=ad_type,
                parent=None,
                sort_order=cat_order,
                is_active=True,
            )

            for sub_order, sub_name in enumerate(subcategories):
                MarketplaceCategory.objects.create(
                    name=sub_name,
                    slug=_make_unique_slug(MarketplaceCategory, ad_type, sub_name),
                    ad_type=ad_type,
                    parent=parent_cat,
                    sort_order=sub_order,
                    is_active=True,
                )


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0004_remove_marketplacecategory_icon_url'),
    ]

    operations = [
        migrations.RunPython(seed_categories, migrations.RunPython.noop),
    ]
