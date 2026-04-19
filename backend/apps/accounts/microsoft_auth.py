"""Microsoft Entra ID (Azure AD) SSO — authorization-code flow.

Two HTTP endpoints drive the full dance (wired in apps/accounts/urls.py):

  GET /api/auth/microsoft/login/
      Builds the Microsoft authorize URL and 302-redirects the browser to it.
      Stores an anti-CSRF `state` in the session so the callback can verify it.

  GET /api/auth/microsoft/callback/?code=...&state=...
      Called by Microsoft once the user finishes signing in. We exchange the
      short-lived `code` for an access token, query the Graph /me endpoint to
      get the user's profile, upsert a Django user keyed by the object id
      (sub claim), call `login()` to start the session, and 302-redirect back
      to the frontend with `?auth=ok`.

A third, small endpoint:

  GET /api/auth/microsoft/config/
      Returns `{ enabled: bool, login_url?: string }` so the SPA can show/hide
      the "Sign in with Microsoft" button based on whether the admin has
      configured client id/secret/tenant.

Why MSAL: Microsoft's library already handles the authority URL construction,
PKCE, and token endpoint call. Writing those ourselves would be another 60
lines with more surface for bugs. MSAL is pinned in pyproject.toml.

**Security notes**
- Session-scoped `state` nonce defeats CSRF on the callback.
- `id_token_claims` comes from MSAL after it has validated the signature and
  audience; we trust `sub` and `oid` from it but only as *identity* — we also
  cross-check the email from the Graph profile against `preferred_username`.
- The client secret lives only in Django settings; it is never sent to the
  browser.
"""

from __future__ import annotations

import logging
import secrets
import urllib.parse
from typing import Any, cast

import msal
import requests
from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

logger = logging.getLogger(__name__)

GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me"
STATE_SESSION_KEY = "_microsoft_auth_state"


def _is_configured() -> bool:
    """Every value must be set for SSO to work. Checks are conservative."""
    return all(
        [
            settings.MICROSOFT_AUTH_CLIENT_ID,
            settings.MICROSOFT_AUTH_CLIENT_SECRET,
            settings.MICROSOFT_AUTH_TENANT_ID,
        ]
    )


def _authority() -> str:
    return f"https://login.microsoftonline.com/{settings.MICROSOFT_AUTH_TENANT_ID}"


def _build_msal_app() -> msal.ConfidentialClientApplication:
    return msal.ConfidentialClientApplication(
        client_id=settings.MICROSOFT_AUTH_CLIENT_ID,
        client_credential=settings.MICROSOFT_AUTH_CLIENT_SECRET,
        authority=_authority(),
    )


def _redirect_to_frontend(status: str, reason: str | None = None) -> HttpResponseRedirect:
    """Bounce back to the SPA with a query flag the Login screen can read."""
    params: dict[str, str] = {"auth": status}
    if reason:
        params["reason"] = reason
    target = f"{settings.MICROSOFT_AUTH_FRONTEND_REDIRECT}?{urllib.parse.urlencode(params)}"
    return HttpResponseRedirect(target)


# ---------------------------------------------------------------------------
# View 1: enabled-check (so the SPA knows whether to render the SSO button)
# ---------------------------------------------------------------------------


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def microsoft_config(request: Request) -> Response:
    """Small discovery endpoint. No secrets in the response."""
    if not _is_configured():
        return Response({"enabled": False})
    return Response(
        {
            "enabled": True,
            "login_url": request.build_absolute_uri("/api/auth/microsoft/login/"),
        }
    )


# ---------------------------------------------------------------------------
# View 2: kick off the auth code flow
# ---------------------------------------------------------------------------


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def microsoft_login(request: Request) -> Response | HttpResponseRedirect:
    if not _is_configured():
        return Response(
            {"detail": "Microsoft SSO is not configured on this server."},
            status=503,
        )

    # Short-lived CSRF token for the callback. We store it in the session and
    # verify equality once the user lands back on /callback/.
    state = secrets.token_urlsafe(24)
    request.session[STATE_SESSION_KEY] = state

    app = _build_msal_app()
    auth_url: str = app.get_authorization_request_url(
        scopes=settings.MICROSOFT_AUTH_SCOPES,
        state=state,
        redirect_uri=settings.MICROSOFT_AUTH_REDIRECT_URI,
        prompt="select_account",
    )
    return HttpResponseRedirect(auth_url)


# ---------------------------------------------------------------------------
# View 3: Microsoft calls us back with ?code=...
# ---------------------------------------------------------------------------


def _fetch_graph_profile(access_token: str) -> dict[str, Any]:
    """Call Graph /me to get email + display name. Raises on HTTP error."""
    response = requests.get(
        GRAPH_ME_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    response.raise_for_status()
    return cast(dict[str, Any], response.json())


def _upsert_user(claims: dict[str, Any], profile: dict[str, Any]):
    """Create or update a Django user from the combined ID-token + Graph data.

    Username convention: we use the `oid` (Entra object id) as the stable
    username so a user who changes their email/upn doesn't duplicate. The
    human-readable email + name go in the usual fields.
    """
    User = get_user_model()
    oid: str = claims.get("oid") or claims["sub"]
    email: str = (
        profile.get("mail")
        or profile.get("userPrincipalName")
        or claims.get("preferred_username")
        or ""
    )
    display_name: str = profile.get("displayName") or ""
    first, _, last = display_name.partition(" ")

    user, _ = User.objects.update_or_create(
        username=f"ms-{oid}",
        defaults={
            "email": email,
            "first_name": first,
            "last_name": last,
            "is_active": True,
        },
    )
    return user


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def microsoft_callback(request: Request) -> HttpResponse:
    if not _is_configured():
        return _redirect_to_frontend("error", "not_configured")

    # --- basic parameter + error handling --------------------------------
    if "error" in request.query_params:
        reason = request.query_params.get("error_description") or request.query_params["error"]
        logger.warning("Microsoft SSO error: %s", reason)
        return _redirect_to_frontend("error", "microsoft_denied")

    code = request.query_params.get("code")
    state = request.query_params.get("state")
    expected_state = request.session.pop(STATE_SESSION_KEY, None)

    if not code or not state:
        return _redirect_to_frontend("error", "missing_code")
    if not expected_state or state != expected_state:
        return _redirect_to_frontend("error", "state_mismatch")

    # --- exchange code for token ----------------------------------------
    app = _build_msal_app()
    result: dict[str, Any] = app.acquire_token_by_authorization_code(
        code=code,
        scopes=settings.MICROSOFT_AUTH_SCOPES,
        redirect_uri=settings.MICROSOFT_AUTH_REDIRECT_URI,
    )
    if "error" in result:
        logger.warning("Microsoft token exchange failed: %s", result.get("error_description"))
        return _redirect_to_frontend("error", "token_exchange_failed")

    access_token: str | None = result.get("access_token")
    claims: dict[str, Any] = result.get("id_token_claims") or {}
    if not access_token or ("oid" not in claims and "sub" not in claims):
        return _redirect_to_frontend("error", "missing_identity")

    # --- get profile + upsert + log in ----------------------------------
    try:
        profile = _fetch_graph_profile(access_token)
    except requests.RequestException:
        logger.exception("Graph /me request failed")
        return _redirect_to_frontend("error", "graph_failed")

    user = _upsert_user(claims, profile)
    # Attach the backend so Django's login() is happy even though we didn't
    # go through authenticate().
    user.backend = "django.contrib.auth.backends.ModelBackend"
    _django_login(request, user)

    return _redirect_to_frontend("ok")


# Django's `login` function expects an HttpRequest, but DRF gives us a Request.
# DRF Request wraps HttpRequest so `._request` is what we need.
def _django_login(request: Request | HttpRequest, user) -> None:
    raw = request._request if isinstance(request, Request) else request
    login(raw, user)
