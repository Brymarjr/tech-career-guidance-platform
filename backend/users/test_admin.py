from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import MentorshipConnection

User = get_user_model()

class AdminCommandCenterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # 1. Create Admin
        self.admin_user = User.objects.create_superuser(
            username='boss_admin',
            email='admin@techpath.com',
            password='password123',
            role='ADMIN'
        )
        
        # 2. Create Student
        self.student_user = User.objects.create_user(
            username='lowly_student',
            email='student@techpath.com',
            password='password123',
            role='STUDENT'
        )
        
        # 3. Create dummy data for CSV export
        MentorshipConnection.objects.create(
            student=self.student_user,
            mentor=self.admin_user, # Admin acting as mentor for test
            message="Help me!",
            status="PENDING"
        )

    def test_admin_can_promote_user(self):
        """Test: Admin can change a student to a mentor"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin-user-detail', kwargs={'pk': self.student_user.id})
        
        response = self.client.patch(url, {'role': 'MENTOR'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student_user.refresh_from_db()
        self.assertEqual(self.student_user.role, 'MENTOR')

    def test_admin_can_export_csv(self):
        """Test: Admin receives a CSV file response"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin-export-audit')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])

    def test_student_cannot_access_admin_tools(self):
        """SECURITY TEST: Students must be blocked from admin endpoints"""
        self.client.force_authenticate(user=self.student_user)
        
        # Attempt to see user list
        list_url = reverse('admin-user-list')
        list_res = self.client.get(list_url)
        self.assertEqual(list_res.status_code, status.HTTP_403_FORBIDDEN)
        
        # Attempt to promote self
        promote_url = reverse('admin-user-detail', kwargs={'pk': self.student_user.id})
        promote_res = self.client.patch(promote_url, {'role': 'ADMIN'}, format='json')
        self.assertEqual(promote_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_deactivate_user(self):
        """Test: Admin can disable an account"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin-user-detail', kwargs={'pk': self.student_user.id})
        
        response = self.client.patch(url, {'is_active': False}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student_user.refresh_from_db()
        self.assertFalse(self.student_user.is_active)