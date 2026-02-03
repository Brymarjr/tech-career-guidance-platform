from django.urls import path
from .views import SubmitAssessmentView

urlpatterns = [
    path('submit/', SubmitAssessmentView.as_view(), name='assessment-submit'),
]