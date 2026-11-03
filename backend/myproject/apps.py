from django.contrib.admin.apps import AdminConfig
from django.contrib.auth.apps import AuthConfig
from django.contrib.contenttypes.apps import ContentTypesConfig

# MongoDB uses ObjectId primary keys, so Django's built-in apps need them too.
OBJECT_ID = 'django_mongodb_backend.fields.ObjectIdAutoField'


class MongoAdminConfig(AdminConfig):
    default_auto_field = OBJECT_ID


class MongoAuthConfig(AuthConfig):
    default_auto_field = OBJECT_ID


class MongoContentTypesConfig(ContentTypesConfig):
    default_auto_field = OBJECT_ID
