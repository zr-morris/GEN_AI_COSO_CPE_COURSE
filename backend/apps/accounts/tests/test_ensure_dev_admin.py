"""Tests for the ensure_dev_admin management command."""

import pytest
from django.contrib.auth import get_user_model
from django.core.management import CommandError, call_command


@pytest.mark.django_db
def test_creates_default_admin(settings):
    settings.DEBUG = True
    User = get_user_model()
    assert not User.objects.filter(username="admin").exists()

    call_command("ensure_dev_admin")

    user = User.objects.get(username="admin")
    assert user.is_superuser
    assert user.is_staff
    assert user.check_password("admin")


@pytest.mark.django_db
def test_is_idempotent_and_resets_password(settings):
    settings.DEBUG = True
    User = get_user_model()

    call_command("ensure_dev_admin")
    user = User.objects.get(username="admin")
    user.set_password("something-else")
    user.save()

    # Re-running restores the default password (predictable for local dev).
    call_command("ensure_dev_admin")
    user.refresh_from_db()
    assert user.check_password("admin")


@pytest.mark.django_db
def test_refuses_without_debug_unless_forced(settings):
    settings.DEBUG = False
    with pytest.raises(CommandError, match="DEBUG"):
        call_command("ensure_dev_admin")


@pytest.mark.django_db
def test_force_overrides_debug_guard(settings):
    settings.DEBUG = False
    call_command("ensure_dev_admin", "--force")
    assert get_user_model().objects.filter(username="admin").exists()


@pytest.mark.django_db
def test_custom_username_password(settings):
    settings.DEBUG = True
    call_command(
        "ensure_dev_admin",
        "--username=dev",
        "--password=s3cret",
        "--email=dev@example.com",
    )
    user = get_user_model().objects.get(username="dev")
    assert user.email == "dev@example.com"
    assert user.check_password("s3cret")
