from django.utils import timezone
from .models import CustomUser
from asgiref.sync import sync_to_async
from django.utils.deprecation import MiddlewareMixin

class UpdateLastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # Check if the get_response is a coroutine (Async)
        import asyncio
        self._is_coroutine = asyncio.iscoroutinefunction(get_response)

    async def __call__(self, request):
        # Handle the Async call (Daphne/Production)
        if self._is_coroutine:
            response = await self.get_response(request)
            if request.user.is_authenticated:
                await self.update_activity(request.user.id)
            return response
        
        # Handle the Sync call (Local/Development)
        response = self.get_response(request)
        if request.user.is_authenticated:
            # We call the same logic but don't need to await here
            CustomUser.objects.filter(id=request.user.id).update(last_activity=timezone.now())
        return response

    @sync_to_async
    def update_activity(self, user_id):
        # This runs safely in a thread-pool so it won't block Daphne
        CustomUser.objects.filter(id=user_id).update(last_activity=timezone.now())