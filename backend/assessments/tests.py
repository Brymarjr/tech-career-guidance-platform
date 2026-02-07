from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import AssessmentResult, CareerPath, Milestone, UserProgress, ChatMessage
from users.models import Notification, Thread
from unittest.mock import patch, MagicMock
from django.utils import timezone

class AssessmentLogicTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email='tester@riasec.com', username='test_student', password='Password123!')
        
        # Create a Blended Path (AI) and a Primary Path (A)
        self.blended_path = CareerPath.objects.create(trait_type='AI', title='Creative Technologist', duration='12 Weeks')
        self.primary_path = CareerPath.objects.create(trait_type='A', title='General Artistic Path', duration='8 Weeks')
        
        self.milestone = Milestone.objects.create(path=self.blended_path, title='Unity Basics', order=0)

    def test_blended_scoring_logic(self):
        """Verify the service now returns a 2-letter code."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "answers": [
                {"type": "A", "value": 10}, 
                {"type": "I", "value": 8},
                {"type": "R", "value": 1}
            ]
        }
        response = self.client.post('/api/v1/assessments/submit/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['code'], "AI")
        self.assertEqual(response.data['top_trait'], "Artistic")

    def test_roadmap_selection_fallback(self):
        """Test that system finds AI path, then falls back to A if AI is missing."""
        self.client.force_authenticate(user=self.user)
        
        # Scenario 1: User is AI, Blended path exists
        AssessmentResult.objects.create(user=self.user, top_trait='AI', scores={'A': 10, 'I': 8})
        response = self.client.get('/api/v1/assessments/dashboard-summary/')
        self.assertEqual(response.data['roadmap']['title'], 'Creative Technologist')

        # Scenario 2: User is AR (Artistic-Realistic), but only 'A' path exists
        AssessmentResult.objects.create(user=self.user, top_trait='AR', scores={'A': 10, 'R': 8})
        response = self.client.get('/api/v1/assessments/dashboard-summary/')
        self.assertEqual(response.data['roadmap']['title'], 'General Artistic Path')

class MilestoneReviewTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.student = User.objects.create_user(email='s@test.com', username='student', password='pass', role='STUDENT')
        self.mentor = User.objects.create_user(email='m@test.com', username='mentor', password='pass', role='MENTOR')
        
        Thread.objects.create(student=self.student, mentor=self.mentor)
        
        self.path = CareerPath.objects.create(trait_type='I', title='Data Path')
        self.milestone = Milestone.objects.create(path=self.path, title='Python Basics', order=1)

    def test_milestone_submission_flow(self):
        """Test that submitting work changes status and alerts mentor."""
        self.client.force_authenticate(user=self.student)
        url = f'/api/v1/assessments/milestone/{self.milestone.id}/submit/'
        payload = {"submission_url": "https://github.com/test", "notes": "Completed the task"}
        
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, 200)
        
        progress = UserProgress.objects.get(user=self.student, milestone=self.milestone)
        self.assertEqual(progress.status, 'PENDING_REVIEW')
        self.assertTrue(Notification.objects.filter(recipient=self.mentor).exists())

    def test_mentor_approval_flow(self):
        """Test that mentor can approve work and notify student."""
        progress = UserProgress.objects.create(
            user=self.student, 
            milestone=self.milestone, 
            status='PENDING_REVIEW',
            submission_url='https://test.com'
        )
        
        self.client.force_authenticate(user=self.mentor)
        url = f'/api/v1/assessments/progress/{progress.id}/review/'
        payload = {"action": "APPROVE", "feedback": "Great job!"}
        
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, 200)
        
        progress.refresh_from_db()
        self.assertEqual(progress.status, 'COMPLETED')
        self.assertTrue(Notification.objects.filter(recipient=self.student, message__contains="approved").exists())

class MentorDashboardTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.mentor = User.objects.create_user(email='m2@test.com', username='mentor2', password='pass', role='MENTOR')
        self.student = User.objects.create_user(email='s2@test.com', username='student2', password='pass', role='STUDENT')
        
        # Link them
        Thread.objects.create(student=self.student, mentor=self.mentor)
        
        self.path = CareerPath.objects.create(trait_type='I', title='Data Path')
        self.milestone = Milestone.objects.create(path=self.path, title='SQL Basics', order=1)
        
        # Create a pending submission
        UserProgress.objects.create(
            user=self.student, 
            milestone=self.milestone, 
            status='PENDING_REVIEW',
            submission_url='https://github.com/sql-test'
        )

    def test_get_pending_reviews_list(self):
        """Verify mentor can see only their students' pending work."""
        self.client.force_authenticate(user=self.mentor)
        url = '/api/v1/assessments/reviews/pending/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['student_name'], 'student2')
        self.assertEqual(response.data[0]['submission_url'], 'https://github.com/sql-test')

class AIMentorTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email='mentor@test.com', username='mentor_user', password='password123')
        self.path = CareerPath.objects.create(trait_type='I', title='Data Science', duration='12 Weeks')
        AssessmentResult.objects.create(user=self.user, top_trait='IR', scores={'I': 10, 'R': 5})

    @patch('openai.resources.chat.completions.Completions.create')
    def test_chat_endpoint_logic(self, mock_chat_create):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="I am your Data Science mentor."))]
        mock_chat_create.return_value = mock_response
        
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/v1/assessments/chat/', {'message': 'Hello'}, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(ChatMessage.objects.count(), 2)

    @patch('openai.resources.chat.completions.Completions.create')
    def test_chat_quota_error_handling(self, mock_chat_create):
        mock_chat_create.side_effect = Exception("insufficient_quota")
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/v1/assessments/chat/', {'message': 'Hello'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn("recharging", response.data['response'])