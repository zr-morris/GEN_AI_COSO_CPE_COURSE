"""Local development settings."""

from .base import *  # noqa: F403

DEBUG = True

# Permissive defaults for local dev only.
ALLOWED_HOSTS = ["*"]

# Send email to the console instead of an SMTP server.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
