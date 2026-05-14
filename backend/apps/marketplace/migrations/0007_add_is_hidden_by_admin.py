from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0006_marketplace_type_specific_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='marketplaceproduct',
            name='is_hidden_by_admin',
            field=models.BooleanField(default=False),
        ),
    ]
