from django.urls import path

from . import api, microsoft_auth

urlpatterns = [
    path("auth/csrf/", api.csrf, name="auth-csrf"),
    path("auth/me/", api.me, name="auth-me"),
    path("auth/login/", api.login_view, name="auth-login"),
    path("auth/logout/", api.logout_view, name="auth-logout"),
    # Microsoft Entra ID SSO — three endpoints:
    #   config/   : is SSO configured? (public, no secrets in response)
    #   login/    : redirects to Microsoft authorize endpoint
    #   callback/ : handles Microsoft's redirect back, logs the user in,
    #               then bounces to the frontend
    path("auth/microsoft/config/", microsoft_auth.microsoft_config, name="auth-ms-config"),
    path("auth/microsoft/login/", microsoft_auth.microsoft_login, name="auth-ms-login"),
    path(
        "auth/microsoft/callback/",
        microsoft_auth.microsoft_callback,
        name="auth-ms-callback",
    ),
]
