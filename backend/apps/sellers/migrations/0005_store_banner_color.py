from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sellers', '0004_sellerprofile_identity_doc_type_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='store',
            name='banner_color',
            field=models.CharField(blank=True, default='#4C3B8A', max_length=20),
        ),
    ]
