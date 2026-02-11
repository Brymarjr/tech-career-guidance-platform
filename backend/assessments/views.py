from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import AssessmentResult, CareerPath, UserProgress, Milestone, ChatMessage, Question, LearningResource
from .serializers import QuestionSerializer, CareerPathSerializer, MilestoneSerializer, LearningResourceSerializer, StudentResourceSerializer
from .services import RIASECService
from .ai_service import CareerMentorService
from django.contrib.auth import get_user_model
from users.models import Notification, Thread 

def get_user_roadmap_context(user):
    latest_result = AssessmentResult.objects.filter(user=user).order_by('-created_at').first()
    if not latest_result:
        return None

    trait_code = latest_result.top_trait 
    
    # OPTIMIZATION: prefetch_related reduces database hits from ~15 to 1.
    path = CareerPath.objects.prefetch_related(
        'milestones__resources'
    ).filter(trait_type=trait_code).first()
    
    if not path and trait_code:
        primary_char = trait_code[0]
        path = CareerPath.objects.prefetch_related(
            'milestones__resources'
        ).filter(trait_type=primary_char).first()
    
    if not path:
        return None

    # Fetch all progress for this user in one hit to avoid querying inside the loop
    user_progress_map = {
        p.milestone_id: p for p in UserProgress.objects.filter(user=user, milestone__path=path)
    }

    milestone_details = []
    completed_count = 0
    
    # This loop now runs entirely in memory because of the prefetch above
    for m in path.milestones.all():
        progress = user_progress_map.get(m.id)
        current_status = progress.status if progress else 'IN_PROGRESS'
        is_done = (current_status == 'COMPLETED')
        
        if is_done: completed_count += 1
        
        milestone_details.append({
            "id": m.id,
            "title": m.title,
            "order": m.order,
            "status": current_status,
            "is_completed": is_done,
            "submission_url": progress.submission_url if progress else None,
            "feedback": progress.mentor_feedback if progress else None,
            "resources": [{"title": r.title, "url": r.url, "resource_type": r.resource_type} for r in m.resources.all()]
        })

    return {
        "title": path.title,
        "duration": path.duration,
        "milestones": milestone_details,
        "completion_percentage": (completed_count / len(milestone_details) * 100) if milestone_details else 0
    }

class SubmitMilestoneView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, milestone_id):
        milestone = get_object_or_404(Milestone, id=milestone_id)
        submission_url = request.data.get('submission_url')
        notes = request.data.get('notes', '')

        if not submission_url:
            return Response({"error": "A submission URL is required."}, status=status.HTTP_400_BAD_REQUEST)

        progress, _ = UserProgress.objects.get_or_create(user=request.user, milestone=milestone)
        progress.submission_url = submission_url
        progress.submission_notes = notes
        progress.status = 'PENDING_REVIEW'
        progress.save()

        thread = Thread.objects.filter(student=request.user).first()
        if thread and thread.mentor:
            Notification.objects.create(
                recipient=thread.mentor,
                message=f"Submission Alert: {request.user.username} submitted '{milestone.title}' for review."
            )

        return Response({"status": "PENDING_REVIEW"})

class MentorReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, progress_id):
        if request.user.role != 'MENTOR' and not request.user.is_staff:
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

        progress = get_object_or_404(UserProgress, id=progress_id)
        action = request.data.get('action')
        feedback = request.data.get('feedback', '')

        if action == 'APPROVE':
            progress.status = 'COMPLETED'
            progress.is_completed = True
            progress.completed_at = timezone.now()
            notif_msg = f"Your milestone '{progress.milestone.title}' was approved! 🚀"
        elif action == 'REJECT':
            progress.status = 'REJECTED'
            progress.is_completed = False
            notif_msg = f"Feedback on '{progress.milestone.title}': Your mentor requested changes."
        else:
            return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
        
        progress.mentor_feedback = feedback
        progress.save()

        Notification.objects.create(
            recipient=progress.user,
            message=notif_msg
        )

        return Response({"status": progress.status})

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
            return Response({"error": "Please complete assessment."}, status=status.HTTP_400_BAD_REQUEST)

        history = list(reversed(ChatMessage.objects.filter(user=request.user).order_by('-created_at')[:10]))

        try:
            ai_response = CareerMentorService.get_response(request.user, user_message, history, roadmap_data)
            ChatMessage.objects.create(user=request.user, role='user', content=user_message)
            ChatMessage.objects.create(user=request.user, role='assistant', content=ai_response)
            return Response({"response": ai_response})
        except Exception as e:
            if "insufficient_quota" in str(e):
                return Response({"response": "I'm currently recharging (OpenAI Quota)."}, status=status.HTTP_200_OK)
            return Response({"error": "Mentor service unavailable."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubmitAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        answers = request.data.get('answers')
        if not answers:
            return Response({"error": "No answers provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        scores, primary_trait, blended_code = RIASECService.calculate_scores(answers)
        AssessmentResult.objects.create(user=request.user, scores=scores, top_trait=blended_code)
        
        return Response({"top_trait": primary_trait, "scores": scores, "code": blended_code}, status=status.HTTP_201_CREATED)


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roadmap_data = get_user_roadmap_context(request.user)
        latest_result = AssessmentResult.objects.filter(user=request.user).order_by('-created_at').first()
        
        from .models import UserAchievement, UserProgress
        from .serializers import UserAchievementSerializer
        
        all_earned = UserAchievement.objects.filter(user=request.user).select_related('achievement')
        new_achievements = all_earned.filter(is_notified=False)
        new_serialized = UserAchievementSerializer(new_achievements, many=True).data
        
        new_achievements.update(is_notified=True)

        return Response({
            "user": {
                "username": request.user.username, 
                "role": request.user.role,
                "xp_total": request.user.xp_total, 
                "level": request.user.level,
                "has_seen_onboarding": request.user.has_seen_onboarding,      
                "mentor": request.user.mentor_id,
                "mentor_username": request.user.mentor.username if request.user.mentor else None, 
            },
            "assessment": {
                "top_trait": latest_result.top_trait if latest_result else None,
                "scores": latest_result.scores if latest_result else None,
            },
            "roadmap": roadmap_data,
            "achievements": UserAchievementSerializer(all_earned, many=True).data,
            "new_achievements": new_serialized 
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
    
    
class PendingReviewsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'MENTOR' and not request.user.is_staff:
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

        # 1. Get all students directly assigned to this mentor
        # No more Thread filtering - we use the direct relationship
        pending_work = UserProgress.objects.filter(
            user__mentor=request.user,
            status='PENDING_REVIEW'
        ).select_related('user', 'milestone', 'milestone__path').order_by('-completed_at')

        data = []
        for item in pending_work:
            data.append({
                "id": item.id,
                "student_name": item.user.username,
                "milestone_title": item.milestone.title,
                "path_title": item.milestone.path.title,
                "submission_url": item.submission_url,
                "submission_notes": item.submission_notes,
                "submitted_at": item.completed_at
            })

        return Response(data)
    
    
class AdminQuestionListCreateView(generics.ListCreateAPIView):
    queryset = Question.objects.all().order_by('riasec_type')
    serializer_class = QuestionSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            # Allow any logged-in user (student) to read the questions
            return [permissions.IsAuthenticated()]
        # Only Admins can POST (create) new questions
        return [permissions.IsAdminUser()]


class AdminQuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAdminUser]
    
    
class AdminCareerPathListView(generics.ListCreateAPIView):
    queryset = CareerPath.objects.all().prefetch_related('milestones')
    serializer_class = CareerPathSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminMilestoneCreateView(generics.CreateAPIView):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAdminUser]
    
    
class AdminResourceCreateView(generics.CreateAPIView):
    queryset = LearningResource.objects.all()
    serializer_class = LearningResourceSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        milestone_id = self.request.data.get('milestone')
        if milestone_id:
            serializer.save(milestone_id=milestone_id)
        else:
            serializer.save()


class AdminMilestoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAdminUser]
    
    
class StudentLibraryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Try to find path from current progress
        latest_progress = UserProgress.objects.filter(
            user=request.user
        ).select_related('milestone__path').first()
        
        active_path = None
        
        if latest_progress:
            active_path = latest_progress.milestone.path
        else:
            # 2. Fallback: Find path matching their Assessment Result
            result = AssessmentResult.objects.filter(user=request.user).order_by('-created_at').first()
            if result:
                # Check for exact match or first character (e.g., 'RI' matches 'R')
                trait = result.top_trait
                active_path = CareerPath.objects.filter(trait_type=trait).first()
                if not active_path and trait:
                    active_path = CareerPath.objects.filter(trait_type=trait[0]).first()

        # 3. If still no path, just show the first available path so the page isn't empty
        if not active_path:
            active_path = CareerPath.objects.first()

        if not active_path:
            return Response({
                "path_title": "General Resources",
                "resources": []
            })

        # 4. Fetch resources for ALL milestones in this path
        resources = LearningResource.objects.filter(
            milestone__path=active_path
        ).order_by('milestone__order')
        
        serializer = StudentResourceSerializer(resources, many=True)
        
        return Response({
            "path_title": active_path.title,
            "resources": serializer.data
        })
        
        
class AchievementListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import Achievement, UserAchievement
        from .serializers import AchievementSerializer
        
        all_achievements = Achievement.objects.all()
        earned_ids = UserAchievement.objects.filter(user=request.user).values_list('achievement_id', flat=True)
        
        serializer = AchievementSerializer(all_achievements, many=True)
        data = serializer.data
        for item in data:
            item['is_earned'] = item['id'] in earned_ids
            
        return Response(data)
    
    
class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from users.models import CustomUser
        from .models import AssessmentResult 
        
        top_users = CustomUser.objects.filter(role='STUDENT').order_by('-xp_total')[:10]
        
        data = []
        for u in top_users:
            latest_assessment = AssessmentResult.objects.filter(user=u).order_by('-created_at').first()
            data.append({
                "username": u.username,
                "xp": u.xp_total,
                "level": u.level,
                "top_trait": latest_assessment.top_trait if latest_assessment else "N/A",
                "full_name": u.full_name
            })
            
        return Response(data)
    
    
class StudentPortfolioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import UserProgress
        completed_work = UserProgress.objects.filter(
            user=request.user, 
            status='COMPLETED'
        ).exclude(submission_url='').select_related('milestone').order_by('-completed_at')

        portfolio_data = [{
            "id": work.id,
            "milestone_title": work.milestone.title,
            "project_url": work.submission_url,
            "completion_date": work.completed_at,
            "mentor_notes": work.mentor_feedback 
        } for work in completed_work]

        return Response({
            "username": request.user.username,
            "projects": portfolio_data
        })