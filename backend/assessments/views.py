from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import AssessmentResult
from .services import RIASECService

class SubmitAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        answers = request.data.get('answers') # List of {type, value}
        
        if not answers:
            return Response({"error": "No answers provided"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Calculate scores using our service
        scores, top_trait = RIASECService.calculate_scores(answers)

        # 2. Save to database
        result = AssessmentResult.objects.create(
            user=request.user,
            scores=scores,
            top_trait=top_trait
        )

        return Response({
            "id": result.id,
            "scores": scores,
            "top_trait": top_trait,
            "message": "Assessment processed successfully!"
        }, status=status.HTTP_201_CREATED)
        
        
class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        latest_result = AssessmentResult.objects.filter(user=request.user).order_by('-created_at').first()
        
        roadmap = None
        if latest_result:
            roadmap = RIASECService.get_roadmap_data(latest_result.top_trait)

        return Response({
            "user": { "username": request.user.username, "role": request.user.role },
            "assessment": {
                "top_trait": latest_result.top_trait if latest_result else None,
                "scores": latest_result.scores if latest_result else None,
            },
            "roadmap": roadmap # Now includes the mapped path
        })
