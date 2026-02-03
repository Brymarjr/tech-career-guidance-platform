from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import AssessmentResult

class AssessmentLogicTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='tester@riasec.com',
            username='test_student',
            password='Password123!'
        )

    def test_scoring_and_roadmap_integration(self):
        """Verify that submitting an assessment returns a top trait and roadmap exists."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "answers": [
                {"type": "I", "value": 1},
                {"type": "I", "value": 1},
                {"type": "A", "value": 0}
            ]
        }
        response = self.client.post('/api/v1/assessments/submit/', payload, format='json')
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['top_trait'], "Investigative")

    def test_dashboard_summary_with_roadmap(self):
        """Verify the dashboard API returns the user profile and the mapped roadmap."""
        # Create a dummy result first
        AssessmentResult.objects.create(
            user=self.user,
            scores={"I": 10, "R": 2},
            top_trait="Investigative"
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/assessments/dashboard-summary/')
        
        self.assertEqual(response.status_code, 200)
        # Check if the roadmap and milestone details are present
        self.assertIn('roadmap', response.data)
        self.assertIn('milestone_details', response.data['roadmap'])
        self.assertEqual(response.data['roadmap']['title'], 'The Data & AI Path')