from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, RequestPasswordResetView, VerifyOTPView, ConfirmPasswordResetView, UserProfileView, MentorListView, ConnectionRequestView,MentorDashboardView

urlpatterns = [
    
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/request/', RequestPasswordResetView.as_view(), name='password-reset-request'),
    path('password-reset/verify/', VerifyOTPView.as_view(), name='password-reset-verify'),
    path('password-reset/confirm/', ConfirmPasswordResetView.as_view(), name='password-reset-confirm'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', UserProfileView.as_view(), name='user-profile-update'),
    path('mentors/', MentorListView.as_view(), name='mentor-list'),
    path('connect/', ConnectionRequestView.as_view(), name='mentor-connect'),
    path('mentor-dashboard/', MentorDashboardView.as_view(), name='mentor-dashboard'),
    path('mentor-dashboard/<int:pk>/', MentorDashboardView.as_view(), name='mentor-action'),
    
]