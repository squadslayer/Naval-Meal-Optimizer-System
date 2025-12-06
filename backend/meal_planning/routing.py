from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # The '?$' makes the trailing slash optional
    re_path(r'ws/dashboard/?$', consumers.DashboardConsumer.as_asgi()),
]