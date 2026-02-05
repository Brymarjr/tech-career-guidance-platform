from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, RequestPasswordResetView, VerifyOTPView, ConfirmPasswordResetView, ProfileView, MentorListView, ConnectionRequestView,MentorDashboardView, AdminGlobalStatsView, AdminUserManagementView, ExportAuditLogView, SystemHealthView, StudentRequestHistoryView, StudentNotificationView, MentorNotificationView, NotificationView

urlpatterns = [
    
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/request/', RequestPasswordResetView.as_view(), name='password-reset-request'),
    path('password-reset/verify/', VerifyOTPView.as_view(), name='password-reset-verify'),
    path('password-reset/confirm/', ConfirmPasswordResetView.as_view(), name='password-reset-confirm'),
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('mentors/', MentorListView.as_view(), name='mentor-list'),
    path('connect/', ConnectionRequestView.as_view(), name='mentor-connect'),
    path('mentor-dashboard/', MentorDashboardView.as_view(), name='mentor-dashboard'),
    path('mentor-dashboard/<int:pk>/', MentorDashboardView.as_view(), name='mentor-action'),
    path('admin/stats/', AdminGlobalStatsView.as_view(), name='admin-global-stats'),
    path('admin/users/', AdminUserManagementView.as_view(), name='admin-user-list'),
    path('admin/users/<uuid:pk>/', AdminUserManagementView.as_view(), name='admin-user-detail'),
    path('admin/export-audit/', ExportAuditLogView.as_view(), name='admin-export-audit'),
    path('admin/health/', SystemHealthView.as_view(), name='system-health'),
    path('student-requests/', StudentRequestHistoryView.as_view(), name='student-requests-history'),
    path('student-notifications/', StudentNotificationView.as_view(), name='student-notifications'),
    path('mentor-notifications/', MentorNotificationView.as_view(), name='mentor-notifications'),
    path('notifications/', NotificationView.as_view(), name='notifications-list'),
    path('notifications/<int:pk>/', NotificationView.as_view(), name='notification-detail'),
    
]