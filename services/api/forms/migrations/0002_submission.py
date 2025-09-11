# Generated migration for Submission model
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Submission',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('respondent_key', models.CharField(help_text='Unique key for the respondent', max_length=255)),
                ('respondent_email', models.EmailField(blank=True, max_length=254, null=True)),
                ('data', models.JSONField(default=dict, help_text='Form submission data')),
                ('metadata', models.JSONField(blank=True, default=dict, help_text='Additional metadata')),
                ('status', models.CharField(choices=[('in_progress', 'In Progress'), ('completed', 'Completed'), ('abandoned', 'Abandoned')], default='in_progress', max_length=20)),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('time_spent', models.IntegerField(default=0, help_text='Time spent in seconds')),
                ('device_type', models.CharField(blank=True, max_length=50)),
                ('browser', models.CharField(blank=True, max_length=100)),
                ('form', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='forms.form')),
                ('form_version', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='submissions', to='forms.formversion')),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['form', 'status'], name='forms_submi_form_id_9e1a0c_idx'),
                    models.Index(fields=['respondent_key'], name='forms_submi_respond_8e5a9f_idx'),
                    models.Index(fields=['-created_at'], name='forms_submi_created_b0d812_idx'),
                ],
            },
        ),
    ]