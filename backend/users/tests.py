from django.test import TestCase
from django.contrib.auth import get_user_model

class UserAccountTests(TestCase):

    def test_new_user_registration(self):
        """Test that a student user can be created correctly."""
        db = get_user_model()
        user = db.objects.create_user(
            email='testuser@techcareer.ng',
            username='teststudent',
            password='securepassword123',
            role='STUDENT'
        )
        self.assertEqual(user.email, 'testuser@techcareer.ng')
        self.assertEqual(user.role, 'STUDENT')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_superuser_creation(self):
        """Verify the Administrator role required by the SRS."""
        db = get_user_model()
        admin_user = db.objects.create_superuser(
            email='admin@techcareer.ng',
            username='adminuser',
            password='adminpassword123'
        )
        self.assertEqual(admin_user.role, 'ADMIN') # Default logic we should add to models.py
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
