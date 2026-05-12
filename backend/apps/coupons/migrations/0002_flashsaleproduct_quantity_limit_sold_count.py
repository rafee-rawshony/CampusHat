from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('coupons', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='flashsaleproduct',
            name='quantity_limit',
            field=models.PositiveIntegerField(
                blank=True, null=True,
                help_text='Maximum quantity available at flash price.',
            ),
        ),
        migrations.AddField(
            model_name='flashsaleproduct',
            name='sold_count',
            field=models.PositiveIntegerField(
                default=0,
                help_text='Number of units sold during this flash sale.',
            ),
        ),
    ]
