from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import AssessmentResult, CareerPath, UserProgress, Milestone, ChatMessage, Question, LearningResource, UserAchievement
from .serializers import QuestionSerializer, CareerPathSerializer, MilestoneSerializer, LearningResourceSerializer, StudentResourceSerializer, UserAchievementSerializer
from .services import RIASECService
from .ai_service import CareerMentorService
from django.contrib.auth import get_user_model
from users.models import Notification, Thread 

def get_user_roadmap_context(user):
    latest_result = AssessmentResult.objects.filter(user=user).order_by('-created_at').first()
    if not latest_result:
        return None

    trait_code = latest_result.top_trait 
    
    # 1. Attempt specialized blended path
    path = CareerPath.objects.prefetch_related('milestones__resources').filter(trait_type=trait_code).first()
    
    # 2. Fallback to primary trait
    if not path and trait_code:
        primary_char = trait_code[0]
        path = CareerPath.objects.prefetch_related('milestones__resources').filter(trait_type=primary_char).first()
    
    if not path:
        return None

    milestone_details = []
    completed_count = 0
    for m in path.milestones.all():
        progress = UserProgress.objects.filter(user=user, milestone=m).first()
        current_status = progress.status if progress else 'IN_PROGRESS'
        is_done = progress.is_completed if progress else False
        
        if is_done: completed_count += 1
        
        milestone_details.append({
            "id": m.id,
            "title": m.title,
            "status": current_status,
            "is_completed": is_done,
            "submission_url": progress.submission_url if progress else None,
            "feedback": progress.mentor_feedback if progress else None,
            "resources": [{"name": r.title, "url": r.url} for r in m.resources.all()]
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

        # NOTIFICATION: Only uses recipient and message fields
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

        # NOTIFICATION: Alert the student
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
        # 1. Calling the function directly since it's in this file
        roadmap_data = get_user_roadmap_context(request.user)
        
        latest_result = AssessmentResult.objects.filter(user=request.user).order_by('-created_at').first()
        
        from .models import UserAchievement, UserProgress
        from .serializers import UserAchievementSerializer
        
        # 2. Fetch earned achievements
        all_earned = UserAchievement.objects.filter(user=request.user).select_related('achievement')
        
        # 3. Handle notifications for the celebration toast
        new_achievements = all_earned.filter(is_notified=False)
        new_serialized = UserAchievementSerializer(new_achievements, many=True).data
        
        # Mark as notified so the toast only pops once
        new_achievements.update(is_notified=True)

        return Response({
            "user": {
                "username": request.user.username, 
                "role": request.user.role,
                "xp_total": request.user.xp_total, # Pulled from your CustomUser model
                "level": request.user.level        # Pulled from your CustomUser model
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

        # 1. Get all students connected to this mentor
        student_ids = Thread.objects.filter(mentor=request.user).values_list('student_id', flat=True)

        # 2. Get all PENDING_REVIEW progress objects for these students
        pending_work = UserProgress.objects.filter(
            user_id__in=student_ids,
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
                "submitted_at": item.completed_at # Note: we use this for the submission timestamp
            })

        return Response(data)
    
    
class AdminQuestionListCreateView(generics.ListCreateAPIView):
    """
    GET: List all questions
    POST: Create a new question
    """
    queryset = Question.objects.all().order_by('riasec_type')
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAdminUser] # Only Admins can touch this


class AdminQuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a question
    PUT/PATCH: Update a question
    DELETE: Remove a question
    """
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
        # Explicitly grab the milestone ID from the request data
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
        # 1. Look for the user's progress to identify their ACTIVE path
        # select_related avoids multiple database hits
        latest_progress = UserProgress.objects.filter(
            user=request.user
        ).select_related('milestone__path').first()
        
        if not latest_progress:
            # Fallback: If they haven't started a milestone, 
            # find the path by matching the TOP TRAIT from their assessment result
            from .models import AssessmentResult
            result = AssessmentResult.objects.filter(user=request.user).first()
            
            if result:
                # We look for a path where the trait_type matches EXACTLY or contains the trait
                active_path = CareerPath.objects.filter(trait_type=result.top_trait).first()
            else:
                active_path = None
        else:
            active_path = latest_progress.milestone.path

        # 2. If we still can't find a path, return an empty library instead of a wrong one
        if not active_path:
            return Response({
                "path_title": "General Resources",
                "resources": []
            })

        # 3. CRITICAL: Fetch resources ONLY for milestones that belong to this specific path ID
        resources = LearningResource.objects.filter(
            milestone__path_id=active_path.id
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
        
        # Get all possible achievements
        all_achievements = Achievement.objects.all()
        # Get the IDs of achievements this user has earned
        earned_ids = UserAchievement.objects.filter(user=request.user).values_list('achievement_id', flat=True)
        
        serializer = AchievementSerializer(all_achievements, many=True)
        
        # We add an 'is_earned' flag to each achievement for the frontend
        data = serializer.data
        for item in data:
            item['is_earned'] = item['id'] in earned_ids
            
        return Response(data)
    
    
class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from users.models import CustomUser
        from .models import AssessmentResult # Ensure this is imported
        
        # Get top 10 students by XP
        top_users = CustomUser.objects.filter(role='STUDENT').order_by('-xp_total')[:10]
        
        data = []
        for u in top_users:
            # We use the correct default reverse relationship or filter directly
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
        
        # Using 'completed_at' for ordering as confirmed by the error log
        # We also use 'mentor_feedback' which was listed in the choices
        completed_work = UserProgress.objects.filter(
            user=request.user, 
            status='COMPLETED'
        ).exclude(submission_url='').select_related('milestone').order_by('-completed_at')

        portfolio_data = [{
            "id": work.id,
            "milestone_title": work.milestone.title,
            "project_url": work.submission_url,
            "completion_date": work.completed_at, # Matches 'completed_at'
            "mentor_notes": work.mentor_feedback # Matches 'mentor_feedback'
        } for work in completed_work]

        return Response({
            "username": request.user.username,
            "projects": portfolio_data
        })