from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import AssessmentResult, UserProgress, Milestone, CareerPath
from .services import RIASECService
from django.utils import timezone
from django.shortcuts import get_object_or_404

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
        
        roadmap_data = None
        if latest_result:
            # 1. Identify the trait (e.g., 'I')
            trait_char = latest_result.top_trait[0] 
            
            # 2. Fetch CareerPath + Milestones + Resources in ONE query using prefetch_related
            path = CareerPath.objects.prefetch_related('milestones__resources').filter(trait_type=trait_char).first()
            
            if path:
                milestone_details = []
                completed_count = 0
                
                for m in path.milestones.all():
                    # Check if user has completed this milestone
                    progress = UserProgress.objects.filter(user=request.user, milestone=m).first()
                    is_done = progress.is_completed if progress else False
                    if is_done: completed_count += 1
                    
                    # Gather resources for this specific milestone
                    resources = [{
                        "name": res.title,
                        "url": res.url,
                        "type": res.get_resource_type_display()
                    } for res in m.resources.all()]

                    milestone_details.append({
                        "id": m.id,
                        "title": m.title,
                        "is_completed": is_done,
                        "resources": resources
                    })

                roadmap_data = {
                    "title": path.title,
                    "duration": path.duration,
                    "description": path.description,
                    "milestones": milestone_details, # This matches the frontend expectations
                    "completion_percentage": (completed_count / len(milestone_details) * 100) if milestone_details else 0
                }

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
        progress, created = UserProgress.objects.get_or_create(
            user=request.user, 
            milestone=milestone
        )
        
        progress.is_completed = not progress.is_completed
        progress.completed_at = timezone.now() if progress.is_completed else None
        progress.save()

        return Response({
            "is_completed": progress.is_completed,
            "milestone": milestone.title
        })