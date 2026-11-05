from django.conf import settings
from django.db import migrations


def assign_roles(apps, schema_editor):
    """Accounts from before roles existed: anyone who has posted a job is an approved
    employer, everyone else a job seeker (admins get a profile too, role does not limit them)."""
    User = apps.get_model(*settings.AUTH_USER_MODEL.split('.'))
    UserProfile = apps.get_model('myapp', 'UserProfile')
    JobPost = apps.get_model('myapp', 'JobPost')

    employer_ids = {str(pk) for pk in JobPost.objects.values_list('employer_id', flat=True)}
    for user in User.objects.all():
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if str(user.pk) in employer_ids:
            profile.role = 'employer'
            profile.employer_status = 'approved'
        else:
            profile.role = 'candidate'
        profile.save(update_fields=['role', 'employer_status'])


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0006_userprofile_role'),
    ]

    operations = [
        migrations.RunPython(assign_roles, migrations.RunPython.noop),
    ]
