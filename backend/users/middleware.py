from django.utils import timezone
from .models import CustomUser

class UpdateLastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # We use .filter().update() because it's faster, 
            # but we must ensure it hits the DB immediately.
            CustomUser.objects.filter(id=request.user.id).update(last_activity=timezone.now())
        
        return self.get_response(request)