from django.urls import path
from .views import SubmitAssessmentView, DashboardSummaryView

urlpatterns = [
    path('submit/', SubmitAssessmentView.as_view(), name='assessment-submit'),
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]