"""Pytest fixtures shared across the backend test suite."""

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def user(db):
    """A plain authenticated user for permission/auth tests."""
    return User.objects.create_user(
        username="learner",
        email="learner@example.local",
        password="not-a-real-password",
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin",
        email="admin@example.local",
        password="not-a-real-password",
    )
