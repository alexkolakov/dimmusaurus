# Generated by Django 3.0.2 on 2020-01-21 14:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0007_auto_20200120_1956'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='songfile',
            name='file_path',
        ),
        migrations.AddField(
            model_name='songfile',
            name='file_name',
            field=models.CharField(default='', max_length=255, verbose_name='file name'),
            preserve_default=False,
        ),
    ]
