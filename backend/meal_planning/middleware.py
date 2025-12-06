from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs


@database_sync_to_async
def get_user(token_key):
    """
    Asynchronously gets the user from a JWT access token.
    """
    # Import models inside the async function where they are used.
    from django.contrib.auth.models import AnonymousUser
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        access_token = AccessToken(token_key)
        user_id = access_token.get('user_id')
        if user_id:
            return User.objects.get(id=user_id)
        return AnonymousUser()
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Custom middleware for Django Channels to authenticate users via JWT in the query string.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # We need to import AnonymousUser here as well for the else block.
        from django.contrib.auth.models import AnonymousUser

        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()

        return await self.app(scope, receive, send)