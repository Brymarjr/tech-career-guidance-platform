from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import AssessmentResult, CareerPath, Milestone, UserProgress

class AssessmentLogicTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='tester@riasec.com',
            username='test_student',
            password='Password123!'
        )
        # Create a CareerPath so the dashboard has something to find
        self.path = CareerPath.objects.create(
            trait_type='I', 
            title='The Data & AI Path', 
            duration='12 Weeks'
        )
        self.milestone = Milestone.objects.create(
            path=self.path, 
            title='Master Python & SQL', 
            order=0
        )

    def test_scoring_and_roadmap_integration(self):
        """Verify that submitting an assessment returns a top trait."""
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
        self.assertIsNotNone(response.data['roadmap'])
        # Note: Changed 'milestone_details' to 'milestones' to match your latest View logic
        self.assertIn('milestones', response.data['roadmap'])
        self.assertEqual(response.data['roadmap']['title'], 'The Data & AI Path')
        
class ProgressTrackingTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email='dev@test.com', username='dev', password='password123')
        self.path = CareerPath.objects.create(trait_type='I', title='Data Science', duration='12 Weeks')
        self.milestone = Milestone.objects.create(path=self.path, title='Python Basics', order=1)

    def test_milestone_toggle_logic(self):
        """Test that the ToggleMilestoneView correctly creates or updates UserProgress."""
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/assessments/milestone/{self.milestone.id}/toggle/'
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_completed'])
        
        progress = UserProgress.objects.get(user=self.user, milestone=self.milestone)
        self.assertTrue(progress.is_completed)

    def test_dashboard_dynamic_data(self):
        """Test that DashboardSummaryView pulls the correct roadmap from the database."""
        AssessmentResult.objects.create(user=self.user, top_trait='Investigative', scores={'I': 10})
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/assessments/dashboard-summary/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['roadmap']['title'], 'Data Science')
        self.assertEqual(len(response.data['roadmap']['milestones']), 1)
        self.assertEqual(response.data['roadmap']['milestones'][0]['title'], 'Python Basics')