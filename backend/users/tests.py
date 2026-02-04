from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from .models import PasswordResetOTP

User = get_user_model()

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
        self.assertEqual(admin_user.role, 'ADMIN') 
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

# --- NEW: PROFILE MANAGEMENT TESTS ---
class ProfileAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='profile@test.com',
            username='profile_user',
            password='password123',
            full_name='Original Name',
            bio='Original Bio'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        """Verify profile data retrieval for the dashboard."""
        response = self.client.get('/api/v1/users/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['full_name'], 'Original Name')

    def test_patch_profile_update(self):
        """Verify immediate update of profile info (User Story 4)[cite: 52, 63]."""
        payload = {
            "full_name": "Updated Name",
            "bio": "Updated Bio",
            "skills": "Python, Django",
            "career_interest": "Software Engineering"
        }
        response = self.client.patch('/api/v1/users/profile/update/', payload)
        self.assertEqual(response.status_code, 200)
        
        # Verify database update [cite: 27]
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, "Updated Name")
        self.assertEqual(self.user.skills, "Python, Django")
        
class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='student@techpath.com', 
            username='student_user', 
            password='oldpassword123'
        )

    def test_password_reset_flow(self):
        """
        Validates the flowchart sequence[cite: 74]: 
        Enter email -> Send OTP -> Input New Password 
        """
        # 1. Request OTP
        response = self.client.post('/api/v1/users/password-reset/request/', {'email': 'student@techpath.com'})
        self.assertEqual(response.status_code, 200)
        
        # 2. Verify OTP
        otp_record = PasswordResetOTP.objects.get(user__email='student@techpath.com')
        response = self.client.post('/api/v1/users/password-reset/verify/', {
            'email': 'student@techpath.com', 
            'otp': otp_record.otp_code
        })
        self.assertEqual(response.status_code, 200)
        
        # 3. Confirm New Password
        response = self.client.post('/api/v1/users/password-reset/confirm/', {
            'email': 'student@techpath.com', 
            'new_password': 'NewSecurePassword789!'
        })
        self.assertEqual(response.status_code, 200)

        # 4. Login Attempt
        login_response = self.client.post('/api/v1/users/login/', {
            'email': 'student@techpath.com',
            'password': 'NewSecurePassword789!'
        })
        
        if login_response.status_code != 200:
            print(f"Login Error Details: {login_response.data}")
            
        self.assertEqual(login_response.status_code, 200)