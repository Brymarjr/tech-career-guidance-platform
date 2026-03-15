import os
from django.core.asgi import get_asgi_application

# STEP 1: Set the settings module FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# STEP 2: Initialize the Django ASGI application
django_asgi_app = get_asgi_application()

# STEP 3: NOW import your custom stuff (Middleware, Routing)
from channels.routing import ProtocolTypeRouter, URLRouter
from config.middleware import TokenAuthMiddleware 
import users.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddleware(
        URLRouter(
            users.routing.websocket_urlpatterns
        )
    ),
})