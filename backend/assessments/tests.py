from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import AssessmentResult, CareerPath, Milestone, UserProgress, ChatMessage
from unittest.mock import patch, MagicMock

class AIMentorTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email='mentor@test.com', username='mentor_user', password='password123')
        self.path = CareerPath.objects.create(trait_type='I', title='Data Science', duration='12 Weeks')
        AssessmentResult.objects.create(user=self.user, top_trait='Investigative', scores={'I': 10})

    @patch('openai.resources.chat.completions.Completions.create')
    def test_chat_endpoint_logic(self, mock_chat_create):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="I am your Data Science mentor."))]
        mock_chat_create.return_value = mock_response
        
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/v1/assessments/chat/', {'message': 'Hello'}, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['response'], "I am your Data Science mentor.")
        self.assertEqual(ChatMessage.objects.count(), 2)

    @patch('openai.resources.chat.completions.Completions.create')
    def test_chat_quota_error_handling(self, mock_chat_create):
        """Test that the system returns a friendly message instead of crashing on 429 errors."""
        mock_chat_create.side_effect = Exception("insufficient_quota")
        
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/v1/assessments/chat/', {'message': 'Hello'}, format='json')
        
        self.assertEqual(response.status_code, 200)
        # Matches the synchronized wording in the view
        self.assertIn("recharging my knowledge base", response.data['response'])


class AssessmentLogicTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(email='tester@riasec.com', username='test_student', password='Password123!')
        self.path = CareerPath.objects.create(trait_type='I', title='The Data & AI Path', duration='12 Weeks')
        self.milestone = Milestone.objects.create(path=self.path, title='Python Basics', order=0)

    def test_scoring_logic(self):
        self.client.force_authenticate(user=self.user)
        payload = {"answers": [{"type": "I", "value": 1}, {"type": "I", "value": 1}]}
        response = self.client.post('/api/v1/assessments/submit/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['top_trait'], "Investigative")

    def test_dashboard_summary_with_roadmap(self):
        AssessmentResult.objects.create(user=self.user, scores={"I": 10}, top_trait="Investigative")
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/assessments/dashboard-summary/')
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.data['roadmap'])

class ProgressTrackingTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email='dev@test.com', username='dev', password='password123')
        self.path = CareerPath.objects.create(trait_type='I', title='Data Science', duration='12 Weeks')
        self.milestone = Milestone.objects.create(path=self.path, title='Python Basics', order=1)

    def test_milestone_toggle_logic(self):
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/assessments/milestone/{self.milestone.id}/toggle/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_completed'])

    def test_dashboard_progress_calculation(self):
        AssessmentResult.objects.create(user=self.user, top_trait='Investigative', scores={'I': 10})
        UserProgress.objects.create(user=self.user, milestone=self.milestone, is_completed=True)
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/assessments/dashboard-summary/')
        # Checking that the math correctly calculates 100% completion
        self.assertEqual(response.data['roadmap']['completion_percentage'], 100.0)