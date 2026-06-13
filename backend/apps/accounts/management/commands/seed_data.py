from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with a default admin user."

    def handle(self, *args, **options):
        cfg = settings.SEED_ADMIN
        username = cfg["USERNAME"]
        email = cfg["EMAIL"]
        password = cfg["PASSWORD"]

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created admin user '{username}' (password: {password})"
                )
            )
        else:
            # Keep it usable across re-seeds without clobbering a changed password.
            self.stdout.write(
                self.style.WARNING(f"Admin user '{username}' already exists — skipping.")
            )
