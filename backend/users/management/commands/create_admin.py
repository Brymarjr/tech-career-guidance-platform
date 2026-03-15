from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = 'Create a single primary superuser if it does not exist'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Pulling from Render Environment Variables
        username = os.getenv("ADMIN_USERNAME", "Admin")
        email = os.getenv("ADMIN_EMAIL", "braimaholatilewa@gmail.com")
        password = os.getenv("ADMIN_PASSWORD")

        if not password:
            self.stdout.write(self.style.ERROR('ADMIN_PASSWORD environment variable is missing!'))
            return

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f"✅ Primary admin '{username}' created successfully."))
        else:
            self.stdout.write(self.style.WARNING(f"ℹ️ Admin '{username}' already exists. No action taken."))