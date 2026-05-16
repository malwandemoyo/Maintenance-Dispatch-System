from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    verbose_name = 'User Management'

    def ready(self):
        """Application ready hook.

        Provide a `userprofile` convenience attribute on Django's `User`
        instances to maintain backwards compatibility with code/tests
        expecting `user.userprofile` while the model uses `related_name='profile'`.
        """
        from django.contrib.auth.models import User

        # Only add the alias if it doesn't already exist to avoid collisions.
        if not hasattr(User, 'userprofile'):
            setattr(User, 'userprofile', property(lambda self: getattr(self, 'profile', None)))
