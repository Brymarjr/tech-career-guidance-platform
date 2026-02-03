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

    def test_save_assessment_result(self):
        """Verify that we can save and retrieve a RIASEC score set."""
        scores_data = {"R": 15, "I": 30, "A": 10, "S": 5, "E": 20, "C": 10}
        result = AssessmentResult.objects.create(
            user=self.user,
            scores=scores_data,
            top_trait="Investigative"
        )
        self.assertEqual(result.top_trait, "Investigative")
        self.assertEqual(result.scores['I'], 30)

    def test_scoring_logic_endpoint(self):
        """Test the API endpoint correctly calculates the top trait."""
        # Force_authenticate will work because we are using APITestCase
        self.client.force_authenticate(user=self.user)
        payload = {
            "answers": [
                {"type": "I", "value": 1},
                {"type": "I", "value": 1},
                {"type": "R", "value": 1}
            ]
        }
        response = self.client.post('/api/v1/assessments/submit/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['top_trait'], "Investigative")