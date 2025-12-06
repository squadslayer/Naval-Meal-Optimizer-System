import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

# Set the DJANGO_SETTINGS_MODULE environment variable.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_project.settings')

# This is the crucial part:
# It initializes the Django application registry.
django.setup()

# Now we can safely import our middleware and routing.
from meal_planning.middleware import JWTAuthMiddleware
import meal_planning.routing


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(
            meal_planning.routing.websocket_urlpatterns
        )
    ),
})