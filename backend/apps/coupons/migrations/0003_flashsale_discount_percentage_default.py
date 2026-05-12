from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('coupons', '0002_flashsaleproduct_quantity_limit_sold_count'),
    ]

    operations = [
        migrations.AlterField(
            model_name='flashsale',
            name='discount_percentage',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
    ]
