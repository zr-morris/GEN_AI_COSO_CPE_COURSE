"""Tests for the SPA-facing auth endpoints."""

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api(db) -> APIClient:
    return APIClient(enforce_csrf_checks=False)


@pytest.mark.django_db
def test_csrf_endpoint_sets_cookie(api):
    response = api.get("/api/auth/csrf/")
    assert response.status_code == 200
    assert "csrftoken" in response.cookies


@pytest.mark.django_db
def test_me_requires_authentication(api):
    assert api.get("/api/auth/me/").status_code in (401, 403)


@pytest.mark.django_db
def test_login_with_valid_credentials_returns_user(api, user):
    response = api.post(
        "/api/auth/login/",
        data={"username": "learner", "password": "not-a-real-password"},
        format="json",
    )
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "learner"
    assert body["email"] == "learner@example.local"
    assert body["isStaff"] is False


@pytest.mark.django_db
def test_login_with_invalid_credentials_is_401(api, user):
    response = api.post(
        "/api/auth/login/",
        data={"username": "learner", "password": "wrong"},
        format="json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_me_after_login(api, user):
    api.post(
        "/api/auth/login/",
        data={"username": "learner", "password": "not-a-real-password"},
        format="json",
    )
    response = api.get("/api/auth/me/")
    assert response.status_code == 200
    assert response.json()["username"] == "learner"


@pytest.mark.django_db
def test_logout_ends_session(api, user):
    api.post(
        "/api/auth/login/",
        data={"username": "learner", "password": "not-a-real-password"},
        format="json",
    )
    assert api.post("/api/auth/logout/").status_code == 204
    assert api.get("/api/auth/me/").status_code in (401, 403)
