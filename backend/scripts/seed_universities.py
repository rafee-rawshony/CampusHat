"""
Seed script: Add common Bangladeshi universities to the database.
Run: docker exec campushat_backend python manage.py shell < seed_universities.py
Or:  docker exec campushat_backend python seed_universities.py
"""

universities = [
    {"name": "American International University-Bangladesh", "short_name": "AIUB", "division": "Dhaka", "district": "Dhaka"},
    {"name": "Independent University, Bangladesh", "short_name": "IUB", "division": "Dhaka", "district": "Dhaka"},
    {"name": "North South University", "short_name": "NSU", "division": "Dhaka", "district": "Dhaka"},
    {"name": "East West University", "short_name": "EWU", "division": "Dhaka", "district": "Dhaka"},
    {"name": "United International University", "short_name": "UIU", "division": "Dhaka", "district": "Dhaka"},
    {"name": "University of Dhaka", "short_name": "DU", "division": "Dhaka", "district": "Dhaka"},
    {"name": "Bangladesh University of Engineering and Technology", "short_name": "BUET", "division": "Dhaka", "district": "Dhaka"},
    {"name": "Chittagong University of Engineering and Technology", "short_name": "CUET", "division": "Chittagong", "district": "Chattogram"},
    {"name": "Khulna University of Engineering and Technology", "short_name": "KUET", "division": "Khulna", "district": "Khulna"},
    {"name": "Rajshahi University", "short_name": "RU", "division": "Rajshahi", "district": "Rajshahi"},
    {"name": "Shahjalal University of Science and Technology", "short_name": "SUST", "division": "Sylhet", "district": "Sylhet"},
    {"name": "University of Chittagong", "short_name": "CU", "division": "Chittagong", "district": "Chattogram"},
    {"name": "Jahangirnagar University", "short_name": "JU", "division": "Dhaka", "district": "Dhaka"},
    {"name": "Bangladesh Agricultural University", "short_name": "BAU", "division": "Mymensingh", "district": "Mymensingh"},
    {"name": "Islamic University of Technology", "short_name": "IUT", "division": "Dhaka", "district": "Gazipur"},
]

import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.universities.models import University

added = 0
skipped = 0
for u in universities:
    obj, created = University.objects.get_or_create(
        short_name=u["short_name"],
        defaults={
            "name": u["name"],
            "division": u["division"],
            "district": u["district"],
            "is_active": True,
        }
    )
    if created:
        added += 1
        print(f"✓ Added: {u['short_name']} - {u['name']}")
    else:
        # Make sure existing ones are active
        if not obj.is_active:
            obj.is_active = True
            obj.save()
            print(f"↑ Activated: {u['short_name']} - {u['name']}")
        else:
            skipped += 1

print(f"\n✅ Done. Added: {added}, Already existed: {skipped}")
print(f"Total universities now: {University.objects.filter(is_active=True).count()}")
