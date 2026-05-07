from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0002_add_financial_field_validators'),
    ]

    operations = [
        migrations.AddField(
            model_name='marketplacechat',
            name='is_active',
            field=models.BooleanField(db_index=True, default=True),
        ),
    ]
