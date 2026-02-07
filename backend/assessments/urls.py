from django.urls import path
from .views import (
    SubmitAssessmentView, 
    DashboardSummaryView, 
    ToggleMilestoneView, 
    ChatWithMentorView,
    AdminDashboardStatsView,
    SubmitMilestoneView,
    MentorReviewView,
    PendingReviewsListView,
    AdminQuestionDetailView,
    AdminQuestionListCreateView,
    AdminCareerPathListView,
    AdminMilestoneCreateView,
    AdminMilestoneDetailView,
    AdminResourceCreateView,
    StudentLibraryView
)

urlpatterns = [
    # Assessment & Dashboard
    path('submit/', SubmitAssessmentView.as_view(), name='submit-assessment'),
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('chat/', ChatWithMentorView.as_view(), name='mentor-chat'),
    
    # Simple Toggle (Backward Compatibility)
    path('milestone/<int:milestone_id>/toggle/', ToggleMilestoneView.as_view(), name='toggle-milestone'),

    # Milestone Submission & Review System
    # Student uses this to submit work
    path('milestone/<int:milestone_id>/submit/', SubmitMilestoneView.as_view(), name='submit-milestone-work'),
    
    # Mentor uses this to approve/reject
    path('progress/<int:progress_id>/review/', MentorReviewView.as_view(), name='mentor-review-milestone'),

    # Admin
    path('admin-stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    
    # Review List for Mentors
    path('reviews/pending/', PendingReviewsListView.as_view(), name='pending-reviews-list'),
    
    # Question Management
    path('questions/', AdminQuestionListCreateView.as_view(), name='admin-questions-list'),
    path('questions/<int:pk>/', AdminQuestionDetailView.as_view(), name='admin-question-detail'),
    path('admin/paths/', AdminCareerPathListView.as_view(), name='admin-paths'),
    path('admin/milestones/', AdminMilestoneCreateView.as_view(), name='admin-milestones'),
    path('admin/milestones/<int:pk>/', AdminMilestoneDetailView.as_view(), name='admin-milestone-detail'),
    path('admin/resources/', AdminResourceCreateView.as_view(), name='admin-resource-create'),
    path('library/', StudentLibraryView.as_view(), name='student-library'),
]