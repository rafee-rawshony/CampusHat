from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0005_alter_otpcode_purpose'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('normal_user', 'Normal User'),
                    ('student', 'Student'),
                    ('faculty', 'Faculty'),
                    ('seller', 'Seller'),
                    ('seller_mod', 'Seller Moderator'),
                    ('marketplace_mod', 'Marketplace Moderator'),
                    ('moderator', 'Moderator'),
                    ('admin', 'Admin'),
                ],
                db_index=True,
                default='normal_user',
                help_text='System role determining access rights.',
                max_length=20,
            ),
        ),
    ]
