"""Session-cookie auth endpoints for the React SPA.

Routes (mounted at `/api/auth/`):

- `GET  /api/auth/csrf/`    → sets the `csrftoken` cookie. Call once on app load
                              before any unsafe (POST/PUT/DELETE) request.
- `GET  /api/auth/me/`      → current user, or 401.
- `POST /api/auth/login/`   → username + password → starts session, returns user.
- `POST /api/auth/logout/`  → ends session, returns 204.

The frontend must include the `X-CSRFToken` header (mirroring the cookie value)
on unsafe requests because Django's CsrfViewMiddleware is on. Session cookies
are sent automatically by the browser.
"""

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .serializers import LoginSerializer, UserSerializer


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def csrf(request):
    """Force-issue a CSRF cookie. Body is empty; the cookie is the side effect."""
    get_token(request)
    return Response({"detail": "CSRF cookie set."})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = authenticate(
        request,
        username=serializer.validated_data["username"],
        password=serializer.validated_data["password"],
    )
    if user is None:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    login(request, user)
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)
