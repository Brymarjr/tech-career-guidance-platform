from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Prepending 'v1' to the route ensures scalability (Api Versioning)
    path('api/v1/users/', include('users.urls')),
    path('api/v1/assessments/', include('assessments.urls')),
]