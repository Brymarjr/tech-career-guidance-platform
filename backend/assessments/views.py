from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import AssessmentResult, CareerPath, UserProgress, Milestone, ChatMessage
from .services import RIASECService
from .ai_service import CareerMentorService
from django.contrib.auth import get_user_model

def get_user_roadmap_context(user):
    latest_result = AssessmentResult.objects.filter(user=user).order_by('-created_at').first()
    if not latest_result:
        return None

    trait_char = latest_result.top_trait[0]
    path = CareerPath.objects.prefetch_related('milestones__resources').filter(trait_type=trait_char).first()
    
    if not path:
        return None

    milestone_details = []
    completed_count = 0
    for m in path.milestones.all():
        progress = UserProgress.objects.filter(user=user, milestone=m).first()
        is_done = progress.is_completed if progress else False
        if is_done: completed_count += 1
        
        milestone_details.append({
            "id": m.id,
            "title": m.title,
            "is_completed": is_done,
            "resources": [{"name": r.title, "url": r.url} for r in m.resources.all()]
        })

    return {
        "title": path.title,
        "duration": path.duration,
        "milestones": milestone_details,
        "completion_percentage": (completed_count / len(milestone_details) * 100) if milestone_details else 0
    }


class AdminDashboardStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        User = get_user_model()
        return Response({
            "metrics": {
                "total_users": User.objects.count(),
                "total_assessments": AssessmentResult.objects.count(),
                "system_status": "Healthy"
            }
        })

class ChatWithMentorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message')
        roadmap_data = get_user_roadmap_context(request.user)
        
        if not roadmap_data:
            return Response({"error": "Please complete your assessment first."}, status=status.HTTP_400_BAD_REQUEST)

        history = list(reversed(ChatMessage.objects.filter(user=request.user).order_by('-created_at')[:10]))

        try:
            ai_response = CareerMentorService.get_response(request.user, user_message, history, roadmap_data)
            ChatMessage.objects.create(user=request.user, role='user', content=user_message)
            ChatMessage.objects.create(user=request.user, role='assistant', content=ai_response)
            return Response({"response": ai_response})
            
        except Exception as e:
            error_msg = str(e)
            if "insufficient_quota" in error_msg:
                # Synchronized message for the test to find
                fallback = "I'm currently recharging my knowledge base (OpenAI Quota Exceeded). Please check back later!"
                return Response({"response": fallback}, status=status.HTTP_200_OK)
            
            return Response({"error": "Mentor service unavailable."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubmitAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        answers = request.data.get('answers')
        if not answers:
            return Response({"error": "No answers provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        scores, top_trait = RIASECService.calculate_scores(answers)
        AssessmentResult.objects.create(user=request.user, scores=scores, top_trait=top_trait)
        return Response({"top_trait": top_trait, "scores": scores}, status=status.HTTP_201_CREATED)

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roadmap_data = get_user_roadmap_context(request.user)
        latest_result = AssessmentResult.objects.filter(user=request.user).order_by('-created_at').first()
        return Response({
            "user": {"username": request.user.username, "role": request.user.role},
            "assessment": {
                "top_trait": latest_result.top_trait if latest_result else None,
                "scores": latest_result.scores if latest_result else None,
            },
            "roadmap": roadmap_data
        })

class ToggleMilestoneView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, milestone_id):
        milestone = get_object_or_404(Milestone, id=milestone_id)
        progress, _ = UserProgress.objects.get_or_create(user=request.user, milestone=milestone)
        progress.is_completed = not progress.is_completed
        progress.completed_at = timezone.now() if progress.is_completed else None
        progress.save()
        return Response({"is_completed": progress.is_completed, "milestone": milestone.title})

