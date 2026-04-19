"""Tests for the Microsoft Entra ID SSO flow.

MSAL + the Graph HTTP call are mocked so these run fast and don't need
network access or a real Azure tenant.
"""

from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

MS_SETTINGS = {
    "MICROSOFT_AUTH_CLIENT_ID": "test-client-id",
    "MICROSOFT_AUTH_CLIENT_SECRET": "test-secret",
    "MICROSOFT_AUTH_TENANT_ID": "test-tenant",
    "MICROSOFT_AUTH_REDIRECT_URI": "http://testserver/api/auth/microsoft/callback/",
    "MICROSOFT_AUTH_FRONTEND_REDIRECT": "http://localhost:5173",
}


@pytest.fixture
def api() -> APIClient:
    return APIClient()


# ---------------------------------------------------------------------------
# /config/ endpoint
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_config_reports_disabled_when_env_unset(api, settings):
    # Explicitly clear any env-provided values in the test runtime.
    settings.MICROSOFT_AUTH_CLIENT_ID = ""
    settings.MICROSOFT_AUTH_CLIENT_SECRET = ""
    settings.MICROSOFT_AUTH_TENANT_ID = ""

    response = api.get("/api/auth/microsoft/config/")
    assert response.status_code == 200
    assert response.json() == {"enabled": False}


@pytest.mark.django_db
def test_config_reports_enabled_when_settings_present(api, settings):
    for k, v in MS_SETTINGS.items():
        setattr(settings, k, v)

    response = api.get("/api/auth/microsoft/config/")
    assert response.status_code == 200
    body = response.json()
    assert body["enabled"] is True
    assert body["login_url"].endswith("/api/auth/microsoft/login/")


# ---------------------------------------------------------------------------
# /login/ endpoint
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_login_503_when_not_configured(api, settings):
    settings.MICROSOFT_AUTH_CLIENT_ID = ""
    assert api.get("/api/auth/microsoft/login/").status_code == 503


@pytest.mark.django_db
def test_login_redirects_to_microsoft_authorize_url(api, settings):
    """MSAL is mocked so we don't hit Microsoft's OIDC metadata endpoint."""
    for k, v in MS_SETTINGS.items():
        setattr(settings, k, v)

    captured_url = (
        "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/authorize"
        f"?client_id={MS_SETTINGS['MICROSOFT_AUTH_CLIENT_ID']}"
        f"&redirect_uri={MS_SETTINGS['MICROSOFT_AUTH_REDIRECT_URI']}"
        "&state=__state_placeholder__"
        "&response_type=code"
        "&scope=User.Read"
    )

    with patch("apps.accounts.microsoft_auth.msal.ConfidentialClientApplication") as mock_app_cls:
        # The real `get_authorization_request_url` interpolates the `state`
        # kwarg into the URL; mimic that here so our assertion picks it up.
        def fake_url(**kwargs):
            return captured_url.replace("__state_placeholder__", kwargs["state"])

        mock_app_cls.return_value.get_authorization_request_url.side_effect = fake_url

        response = api.get("/api/auth/microsoft/login/")

    assert response.status_code == 302

    parsed = urlparse(response["Location"])
    assert parsed.netloc == "login.microsoftonline.com"
    assert MS_SETTINGS["MICROSOFT_AUTH_TENANT_ID"] in parsed.path

    qs = parse_qs(parsed.query)
    assert qs["client_id"] == [MS_SETTINGS["MICROSOFT_AUTH_CLIENT_ID"]]
    assert qs["state"]  # non-empty
    assert qs["redirect_uri"] == [MS_SETTINGS["MICROSOFT_AUTH_REDIRECT_URI"]]
    # State is stashed in the session so the callback can verify it.
    assert api.session["_microsoft_auth_state"] == qs["state"][0]


# ---------------------------------------------------------------------------
# /callback/ endpoint
# ---------------------------------------------------------------------------


def _prime_session_state(api: APIClient, state: str) -> None:
    """Helper — put a known state value in the client's session."""
    session = api.session
    session["_microsoft_auth_state"] = state
    session.save()


@pytest.mark.django_db
def test_callback_rejects_state_mismatch(api, settings):
    for k, v in MS_SETTINGS.items():
        setattr(settings, k, v)
    _prime_session_state(api, "expected-state")

    response = api.get("/api/auth/microsoft/callback/?code=abc&state=forged-state")
    assert response.status_code == 302
    assert "auth=error" in response["Location"]
    assert "reason=state_mismatch" in response["Location"]


@pytest.mark.django_db
def test_callback_bails_when_code_missing(api, settings):
    for k, v in MS_SETTINGS.items():
        setattr(settings, k, v)
    _prime_session_state(api, "s1")

    response = api.get("/api/auth/microsoft/callback/?state=s1")
    assert response.status_code == 302
    assert "reason=missing_code" in response["Location"]


@pytest.mark.django_db
def test_callback_surface_microsoft_error(api, settings):
    for k, v in MS_SETTINGS.items():
        setattr(settings, k, v)

    response = api.get(
        "/api/auth/microsoft/callback/?error=access_denied&error_description=user+canceled"
    )
    assert response.status_code == 302
    assert "reason=microsoft_denied" in response["Location"]


@pytest.mark.django_db
def test_callback_happy_path_creates_user_and_logs_in(api, settings):
    for k, v in MS_SETTINGS.items():
        setattr(settings, k, v)
    _prime_session_state(api, "happy-state")

    fake_token_response = {
        "access_token": "fake-access-token",
        "id_token_claims": {
            "oid": "11111111-2222-3333-4444-555555555555",
            "preferred_username": "alice@contoso.com",
        },
    }
    fake_profile = {
        "displayName": "Alice Doe",
        "mail": "alice@contoso.com",
        "userPrincipalName": "alice@contoso.com",
    }

    with (
        patch("apps.accounts.microsoft_auth.msal.ConfidentialClientApplication") as mock_app_cls,
        patch(
            "apps.accounts.microsoft_auth._fetch_graph_profile",
            return_value=fake_profile,
        ),
    ):
        mock_app_cls.return_value.acquire_token_by_authorization_code.return_value = (
            fake_token_response
        )

        response = api.get("/api/auth/microsoft/callback/?code=xyz&state=happy-state")

    assert response.status_code == 302
    assert "auth=ok" in response["Location"]

    # A new user was created and an auth-backed session opened.
    User = get_user_model()
    user = User.objects.get(username="ms-11111111-2222-3333-4444-555555555555")
    assert user.email == "alice@contoso.com"
    assert user.first_name == "Alice"
    assert user.last_name == "Doe"

    # Confirm /me/ now returns this user (cookie-auth round-trip).
    me = api.get("/api/auth/me/")
    assert me.status_code == 200
    assert me.json()["email"] == "alice@contoso.com"


@pytest.mark.django_db
def test_callback_token_exchange_failure_redirects_to_frontend_with_error(api, settings):
    for k, v in MS_SETTINGS.items():
        setattr(settings, k, v)
    _prime_session_state(api, "s")

    with patch("apps.accounts.microsoft_auth.msal.ConfidentialClientApplication") as mock_app_cls:
        mock_app_cls.return_value.acquire_token_by_authorization_code.return_value = {
            "error": "invalid_grant",
            "error_description": "bad code",
        }

        response = api.get("/api/auth/microsoft/callback/?code=c&state=s")

    assert response.status_code == 302
    assert "reason=token_exchange_failed" in response["Location"]


# ---------------------------------------------------------------------------
# Reverse URL names (cheap sanity)
# ---------------------------------------------------------------------------


def test_reverse_urls():
    assert reverse("auth-ms-config") == "/api/auth/microsoft/config/"
    assert reverse("auth-ms-login") == "/api/auth/microsoft/login/"
    assert reverse("auth-ms-callback") == "/api/auth/microsoft/callback/"
