"""Tests for the learner-progress API.

Authentication is required, payload is opaque JSON, scope is per-user.
"""

import pytest
from rest_framework.test import APIClient

from apps.progress.models import CourseProgress


@pytest.fixture
def api(db) -> APIClient:
    return APIClient()


SAMPLE_PAYLOAD = {
    "completedModules": ["module1"],
    "completedReviews": [],
    "assessmentResult": None,
    "certificateUnlocked": False,
}


@pytest.mark.django_db
def test_anonymous_cannot_read_progress(api):
    assert api.get("/api/progress/").status_code in (401, 403)


@pytest.mark.django_db
def test_anonymous_cannot_write_progress(api):
    response = api.put(
        "/api/progress/some-course/",
        data={"payload": SAMPLE_PAYLOAD},
        format="json",
    )
    assert response.status_code in (401, 403)


@pytest.mark.django_db
def test_authenticated_upsert_creates_then_updates(api, user):
    api.force_authenticate(user=user)

    create = api.put(
        "/api/progress/test-course/",
        data={"payload": SAMPLE_PAYLOAD},
        format="json",
    )
    assert create.status_code == 201
    body = create.json()
    assert body["courseSlug"] == "test-course"
    assert body["payload"] == SAMPLE_PAYLOAD

    update = api.put(
        "/api/progress/test-course/",
        data={"payload": {**SAMPLE_PAYLOAD, "certificateUnlocked": True}},
        format="json",
    )
    assert update.status_code == 200
    assert update.json()["payload"]["certificateUnlocked"] is True

    # Still only one row.
    assert CourseProgress.objects.filter(user=user, course_slug="test-course").count() == 1


@pytest.mark.django_db
def test_progress_is_per_user(api, user, admin_user):
    CourseProgress.objects.create(user=user, course_slug="x", payload={"a": 1})
    CourseProgress.objects.create(user=admin_user, course_slug="x", payload={"a": 99})

    api.force_authenticate(user=user)
    body = api.get("/api/progress/").json()
    assert len(body) == 1
    assert body[0]["payload"] == {"a": 1}


@pytest.mark.django_db
def test_invalid_payload_rejected(api, user):
    api.force_authenticate(user=user)
    for bad in [{"payload": "not-an-object"}, {"payload": [1, 2]}, {}]:
        response = api.put("/api/progress/c/", data=bad, format="json")
        assert response.status_code == 400


@pytest.mark.django_db
def test_retrieve_returns_only_own_row(api, user, admin_user):
    CourseProgress.objects.create(user=admin_user, course_slug="c", payload={"x": 1})
    api.force_authenticate(user=user)
    assert api.get("/api/progress/c/").status_code == 404


@pytest.mark.django_db
def test_destroy_removes_own_row(api, user):
    CourseProgress.objects.create(user=user, course_slug="c", payload={"x": 1})
    api.force_authenticate(user=user)
    assert api.delete("/api/progress/c/").status_code == 204
    assert not CourseProgress.objects.filter(user=user, course_slug="c").exists()
