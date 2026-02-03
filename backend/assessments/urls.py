from django.urls import path
from .views import SubmitAssessmentView, DashboardSummaryView, ToggleMilestoneView, ChatWithMentorView

urlpatterns = [
    path('submit/', SubmitAssessmentView.as_view(), name='assessment-submit'),
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('milestone/<int:milestone_id>/toggle/', ToggleMilestoneView.as_view(), name='milestone-toggle'),
    path('chat/', ChatWithMentorView.as_view(), name='chat-with-mentor'),
]