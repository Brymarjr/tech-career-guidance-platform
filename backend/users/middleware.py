from django.utils import timezone
from .models import CustomUser
from asgiref.sync import sync_to_async, iscoroutinefunction
from django.utils.decorators import sync_and_async_middleware

@sync_and_async_middleware
def UpdateLastActivityMiddleware(get_response):
    # This logic works for both Sync (runserver) and Async (Daphne)
    if iscoroutinefunction(get_response):
        async def middleware(request):
            response = await get_response(request)
            if request.user.is_authenticated:
                # Update DB in background safely
                await sync_to_async(update_user_activity)(request.user.id)
            return response
    else:
        def middleware(request):
            response = get_response(request)
            if request.user.is_authenticated:
                update_user_activity(request.user.id)
            return response

    return middleware

def update_user_activity(user_id):
    """Simple sync function to update the timestamp"""
    CustomUser.objects.filter(id=user_id).update(last_activity=timezone.now())