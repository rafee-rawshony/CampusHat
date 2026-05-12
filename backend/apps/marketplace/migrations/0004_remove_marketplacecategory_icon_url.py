from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0003_marketplacechat_is_active'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='marketplacecategory',
            name='icon_url',
        ),
    ]
