# Generated by Django 3.0.2 on 2020-01-19 15:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0005_auto_20200119_1711'),
    ]

    operations = [
        migrations.AddField(
            model_name='songlyrics',
            name='title',
            field=models.CharField(default='', max_length=255, verbose_name='original title'),
            preserve_default=False,
        ),
    ]
