import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mall', '0006_storechat_storemessage'),
        ('coupons', '0003_flashsale_discount_percentage_default'),
    ]

    operations = [
        migrations.AddField(
            model_name='cartitem',
            name='flash_sale_product',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='cart_items',
                to='coupons.flashsaleproduct',
            ),
        ),
    ]
