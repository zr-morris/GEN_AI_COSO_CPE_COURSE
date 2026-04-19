"""Test settings — fast in-memory bits where possible, real Postgres for the DB."""

from .base import *  # noqa: F403

DEBUG = False
SECRET_KEY = "test-secret-not-used-anywhere-real"

# Speed up password hashing in tests.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Run media writes to a tmp dir to avoid polluting the dev media/.
import tempfile  # noqa: E402

MEDIA_ROOT = tempfile.mkdtemp(prefix="coso-cpe-test-media-")
