"""Create (or update) a default superuser for local development.

Run this once during first-time setup (or any time you've nuked the DB).
Idempotent — re-running it is safe and will update the password/flags on the
existing user rather than failing.

The defaults match what the root/backend READMEs advertise: `admin` / `admin`.
Both are configurable via env vars so CI or shared dev boxes can override
them without editing the repo.

**Do not run this in production.** The command refuses to run unless `DEBUG`
is True, unless you pass `--force` (for e.g. a controlled staging environment).
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create/update a default local-dev superuser (admin / admin)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default=getattr(settings, "DEV_ADMIN_USERNAME", "admin"),
            help="Username to create/update. Default: 'admin' (or DEV_ADMIN_USERNAME setting).",
        )
        parser.add_argument(
            "--email",
            default=getattr(settings, "DEV_ADMIN_EMAIL", "admin@example.com"),
            help="Email for the account. Default: 'admin@example.com'.",
        )
        parser.add_argument(
            "--password",
            default=getattr(settings, "DEV_ADMIN_PASSWORD", "admin"),
            help="Password to set. Default: 'admin' (or DEV_ADMIN_PASSWORD setting).",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Allow running even when DEBUG is False. Use with caution.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not options["force"]:
            raise CommandError(
                "Refusing to create a default admin outside DEBUG mode. "
                "Pass --force if you really mean it."
            )

        User = get_user_model()
        username: str = options["username"]
        email: str = options["email"]
        password: str = options["password"]

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        # Always reset password + flags so repeated runs yield a predictable login.
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        verb = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} dev superuser '{username}' (password: '{password}'). "
                "Change this before exposing the service."
            )
        )
