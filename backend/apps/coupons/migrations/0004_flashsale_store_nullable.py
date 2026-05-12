import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sellers', '0005_store_banner_color'),
        ('coupons', '0003_flashsale_discount_percentage_default'),
    ]

    operations = [
        migrations.AlterField(
            model_name='flashsale',
            name='store',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='flash_sales',
                to='sellers.store',
                help_text='NULL = platform-wide flash sale (admin only). Any seller can add their products.',
            ),
        ),
    ]
