import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


@pytest.mark.django_db
def test_user_model_is_custom():
    """Sanity check: AUTH_USER_MODEL is wired to apps.accounts.User."""
    assert User._meta.app_label == "accounts"
    assert User._meta.model_name == "user"


@pytest.mark.django_db
def test_email_must_be_unique():
    User.objects.create_user(username="a", email="dup@example.local", password="x")
    with pytest.raises(IntegrityError):
        User.objects.create_user(username="b", email="dup@example.local", password="x")


@pytest.mark.django_db
def test_create_superuser_flags():
    su = User.objects.create_superuser(username="root", email="root@example.local", password="x")
    assert su.is_staff
    assert su.is_superuser
