import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.sellers.models import SellerProfile

approved_sellers = SellerProfile.objects.filter(status='approved')

count = 0
for seller in approved_sellers:
    updated = False
    
    # Update Role
    if seller.user.role in ['normal_user', 'student']:
        seller.user.role = 'seller'
        seller.user.save(update_fields=['role'])
        updated = True
        
    # Update Store
    if hasattr(seller, 'store') and seller.store:
        if seller.store.status != 'active':
            seller.store.status = 'active'
            seller.store.save(update_fields=['status'])
            updated = True
            
    if updated:
        count += 1
        print(f"Fixed seller {seller.id} (user: {seller.user.email})")

print(f"Fixed {count} sellers.")
