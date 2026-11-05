from django.db import migrations, models


def approve_existing_jobs(apps, schema_editor):
    # Jobs posted before the review step existed were already public; keep them that way.
    apps.get_model('myapp', 'JobPost').objects.update(approval_status='approved')


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobpost',
            name='approval_status',
            field=models.CharField(choices=[('pending', 'Pending review'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20),
        ),
        migrations.AddField(
            model_name='jobpost',
            name='rejection_reason',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='jobpost',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(approve_existing_jobs, migrations.RunPython.noop),
    ]
