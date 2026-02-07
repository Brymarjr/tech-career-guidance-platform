import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') 
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def fix_admin():
    username = "admin_test"
    email = "admin@techpath.com"
    password = "password123"
    
    # Delete if exists to start fresh
    User.objects.filter(username=username).delete()
    
    # Create fresh via the manager
    user = User.objects.create_superuser(
        email=email,
        username=username,
        password=password,
        role='ADMIN'
    )
    print(f"✅ User '{username}' created successfully with hashed password.")

if __name__ == "__main__":
    fix_admin()