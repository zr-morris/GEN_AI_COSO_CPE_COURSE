"""Settings shared across dev/test/prod. Reads secrets from the environment.

Per-environment files (`dev.py`, `test.py`, `prod.py`) import * from this and
override only what differs.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-default-override-in-env")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# Wagtail must precede django.contrib.admin so its templates win.
INSTALLED_APPS = [
    # Wagtail
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail.admin",
    "wagtail",
    "modelcluster",
    "taggit",
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "drf_spectacular",
    "corsheaders",
    # Local apps
    "apps.accounts",
    "apps.courses",
    "apps.progress",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", default="coso_cpe"),
        "USER": env("POSTGRES_USER", default="coso_cpe"),
        "PASSWORD": env("POSTGRES_PASSWORD", default=""),
        "HOST": env("POSTGRES_HOST", default="localhost"),
        "PORT": env("POSTGRES_PORT", default="5432"),
        "CONN_MAX_AGE": 60,
    }
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Silences a Wagtail-side Django-6 deprecation about URL form fields. The setting
# itself is also marked deprecated in Django 5.2, but Wagtail still emits the
# warning without it — pick the quieter of the two until Wagtail catches up.
FORMS_URLFIELD_ASSUME_HTTPS = True

# Wagtail
WAGTAIL_SITE_NAME = "COSO CPE Course"
WAGTAILADMIN_BASE_URL = env("WAGTAILADMIN_BASE_URL", default="http://localhost:8000")
WAGTAILDOCS_EXTENSIONS = ["pdf", "docx", "xlsx", "pptx", "csv"]

# DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# OpenAPI / Swagger
SPECTACULAR_SETTINGS = {
    "TITLE": "COSO CPE Course API",
    "DESCRIPTION": "Catalog, learner progress, and session auth for the COSO CPE training app.",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# CORS — locked down by default; dev settings open it to the Vite origin.
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = True

# Django 4+ cross-origin POSTs need the Origin allow-listed separately from
# CORS. The SPA lives on a different port than the API in dev, so anything we
# trust for CORS we also trust for CSRF. Override `CSRF_TRUSTED_ORIGINS` in
# the env if the two sets should diverge.
CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=CORS_ALLOWED_ORIGINS,
)

# Where to bounce the browser after SSO success/failure. Defaults to the Vite
# dev server; override in prod.
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")

# ---------------------------------------------------------------------------
# Microsoft Entra ID (Azure AD) SSO — OAuth2 authorization-code flow
# ---------------------------------------------------------------------------
# All four values are required for SSO to be *enabled*. When any is blank the
# backend advertises `/api/auth/microsoft/config/` as `{ "enabled": False }`
# so the frontend can hide the "Sign in with Microsoft" button gracefully.
#
# Setup instructions (Azure portal):
#   1. App registrations → New registration → pick a name
#   2. Redirect URI: "Web" platform, value = MICROSOFT_AUTH_REDIRECT_URI below
#      (e.g. http://localhost:8000/api/auth/microsoft/callback/ for local dev)
#   3. After creation, copy "Application (client) ID" → MICROSOFT_AUTH_CLIENT_ID
#      and "Directory (tenant) ID" → MICROSOFT_AUTH_TENANT_ID
#   4. Certificates & secrets → New client secret → copy the *Value* (not the
#      secret ID) → MICROSOFT_AUTH_CLIENT_SECRET
#   5. API permissions → confirm the default `User.Read` delegated permission
#      is present (it is by default)
#   6. Restart the backend — the SSO button will light up on the login screen
#
# Use MICROSOFT_AUTH_TENANT_ID = "common" to allow both work and personal
# Microsoft accounts, or "organizations" for any work/school account.
MICROSOFT_AUTH_CLIENT_ID = env("MICROSOFT_AUTH_CLIENT_ID", default="")
MICROSOFT_AUTH_CLIENT_SECRET = env("MICROSOFT_AUTH_CLIENT_SECRET", default="")
MICROSOFT_AUTH_TENANT_ID = env("MICROSOFT_AUTH_TENANT_ID", default="")
MICROSOFT_AUTH_REDIRECT_URI = env(
    "MICROSOFT_AUTH_REDIRECT_URI",
    default="http://localhost:8000/api/auth/microsoft/callback/",
)
MICROSOFT_AUTH_SCOPES: list[str] = ["User.Read"]

# Where to send the browser after the SSO callback completes (success or fail).
# The callback appends ?auth=ok or ?auth=error&reason=... so the frontend can
# show appropriate UI.
MICROSOFT_AUTH_FRONTEND_REDIRECT = env(
    "MICROSOFT_AUTH_FRONTEND_REDIRECT",
    default=FRONTEND_URL,
)
