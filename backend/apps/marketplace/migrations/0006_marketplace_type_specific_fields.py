"""
Add type-specific fields to MarketplaceProduct for distinct ad experiences.

- Sell: brand, model_name, usage_duration, delivery_option
- Rent: location, availability_date, rental_duration, deposit_amount,
        facilities, room_details, rules_conditions, contact_preference
- Service: skills, experience, delivery_time, availability_hours,
           portfolio_url, previous_work_desc
- Food: ingredients, portion_size, delivery_area, food_delivery_time,
        daily_availability, hygiene_certification, combo_packages
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0005_seed_marketplace_categories'),
    ]

    operations = [
        # --- SELL fields ---
        migrations.AddField(
            model_name='marketplaceproduct',
            name='brand',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='model_name',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='usage_duration',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='delivery_option',
            field=models.CharField(
                max_length=10, blank=True, null=True,
                choices=[('meetup', 'Campus Meetup'), ('delivery', 'Delivery'), ('both', 'Both')],
            ),
        ),
        # --- RENT fields ---
        migrations.AddField(
            model_name='marketplaceproduct',
            name='location',
            field=models.CharField(max_length=300, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='availability_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='rental_duration',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='deposit_amount',
            field=models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='facilities',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='room_details',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='rules_conditions',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='contact_preference',
            field=models.CharField(
                max_length=10, blank=True, null=True,
                choices=[('chat', 'In-App Chat'), ('phone', 'Phone Call'), ('both', 'Both')],
            ),
        ),
        # --- SERVICE fields ---
        migrations.AddField(
            model_name='marketplaceproduct',
            name='skills',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='experience',
            field=models.CharField(max_length=200, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='delivery_time',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='availability_hours',
            field=models.CharField(max_length=200, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='portfolio_url',
            field=models.URLField(max_length=500, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='previous_work_desc',
            field=models.TextField(blank=True, null=True),
        ),
        # --- FOOD fields ---
        migrations.AddField(
            model_name='marketplaceproduct',
            name='ingredients',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='portion_size',
            field=models.CharField(
                max_length=10, blank=True, null=True,
                choices=[('small', 'Small'), ('regular', 'Regular'), ('large', 'Large'), ('family', 'Family Pack')],
            ),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='delivery_area',
            field=models.CharField(max_length=300, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='food_delivery_time',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='daily_availability',
            field=models.CharField(max_length=200, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='hygiene_certification',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='combo_packages',
            field=models.TextField(blank=True, null=True),
        ),
    ]
