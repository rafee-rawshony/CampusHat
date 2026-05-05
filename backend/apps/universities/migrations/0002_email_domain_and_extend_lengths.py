# Manually written migration for:
# - Adding email_domain field (used for student verification)
# - Extending short_name max_length 20 -> 30 (to fit hundreds of college abbreviations)
# - Extending slug max_length 25 -> 40 (to fit longer slugs from longer short_names)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('universities', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='university',
            name='email_domain',
            field=models.CharField(
                blank=True,
                help_text="Official email domain for student verification, e.g. 'diu.edu.bd'.",
                max_length=100,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name='university',
            name='short_name',
            field=models.CharField(
                help_text="Abbreviation, e.g. 'DIU'.",
                max_length=30,
                unique=True,
            ),
        ),
        migrations.AlterField(
            model_name='university',
            name='slug',
            field=models.SlugField(
                blank=True,
                help_text='URL-safe identifier, auto-generated from short_name.',
                max_length=40,
                unique=True,
            ),
        ),
    ]
