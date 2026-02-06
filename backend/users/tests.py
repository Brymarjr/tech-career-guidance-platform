from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from .models import PasswordResetOTP, MentorshipConnection, Thread, Message, Notification

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

class ProfileAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='profile@test.com',
            username='profile_user',
            password='password123',
            full_name='Original Name',
            is_available=True
        )
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        """Verify profile data retrieval."""
        response = self.client.get('/api/v1/users/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['full_name'], 'Original Name')

    def test_patch_profile_update(self):
        """Verify profile update using the consolidated endpoint."""
        payload = {
            "full_name": "Updated Name",
            "is_available": False,
            "job_title": "Engineer"
        }
        # Path updated to /profile/ as agreed
        response = self.client.patch('/api/v1/users/profile/', payload)
        self.assertEqual(response.status_code, 200)
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, "Updated Name")
        self.assertFalse(self.user.is_available)

class MentorEcosystemTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email='student@test.com', username='student', password='pass', role='STUDENT'
        )
        self.mentor = User.objects.create_user(
            email='mentor@test.com', username='mentor', password='pass', role='MENTOR', is_available=True
        )

    def test_connection_and_notification_flow(self):
        """Verify connection creates a notification for the mentor."""
        self.client.force_authenticate(user=self.student)
        payload = {"mentor_id": str(self.mentor.id), "message": "Help me!"}
        response = self.client.post('/api/v1/users/connect/', payload)
        
        self.assertEqual(response.status_code, 201)
        # Check if notification was created for mentor
        self.assertTrue(Notification.objects.filter(recipient=self.mentor).exists())

    def test_mentor_accept_creates_thread(self):
        """Verify that accepting a student creates a chat thread automatically."""
        conn = MentorshipConnection.objects.create(student=self.student, mentor=self.mentor)
        self.client.force_authenticate(user=self.mentor)
        
        response = self.client.patch(f'/api/v1/users/mentor-dashboard/{conn.id}/', {'status': 'ACCEPTED'})
        self.assertEqual(response.status_code, 200)
        
        # Verify Thread creation
        self.assertTrue(Thread.objects.filter(student=self.student, mentor=self.mentor).exists())
        # Verify Student notification
        self.assertTrue(Notification.objects.filter(recipient=self.student).exists())

class ChatSystemTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email='s@t.com', username='s', password='p', role='STUDENT'
        )
        self.mentor = User.objects.create_user(
            email='m@t.com', username='m', password='p', role='MENTOR'
        )
        self.thread = Thread.objects.create(student=self.student, mentor=self.mentor)

    def test_send_message(self):
        """Verify users can send messages in a thread."""
        self.client.force_authenticate(user=self.student)
        payload = {"content": "Hello Mentor!"}
        response = self.client.post(f'/api/v1/users/threads/{self.thread.id}/messages/', payload)
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.count(), 1)

    def test_unauthorized_chat_access(self):
        """Ensure random users cannot read other people's chats."""
        stranger = User.objects.create_user(email='x@t.com', username='x', password='p')
        self.client.force_authenticate(user=stranger)
        
        response = self.client.get(f'/api/v1/users/threads/{self.thread.id}/messages/')
        self.assertEqual(response.status_code, 403)