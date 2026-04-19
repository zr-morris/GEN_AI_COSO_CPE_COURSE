"""Smoke tests that catch wiring breakages: settings load, URLs resolve, admins respond."""

import pytest
from django.test import Client
from django.urls import reverse


def test_settings_module_loads():
    from django.conf import settings

    assert settings.AUTH_USER_MODEL == "accounts.User"
    assert "wagtail" in settings.INSTALLED_APPS
    assert "rest_framework" in settings.INSTALLED_APPS


@pytest.mark.django_db
def test_django_admin_login_renders():
    client = Client()
    response = client.get(reverse("admin:login"))
    assert response.status_code == 200


@pytest.mark.django_db
def test_wagtail_admin_login_renders():
    client = Client()
    # Wagtail registers its admin login under the namespace "wagtailadmin".
    response = client.get(reverse("wagtailadmin_login"))
    assert response.status_code == 200
