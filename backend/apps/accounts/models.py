from typing import ClassVar

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user — kept minimal but extensible.

    Email is required and unique so it can be used as a sign-in handle later.
    """

    email = models.EmailField(unique=True)

    REQUIRED_FIELDS: ClassVar[list[str]] = ["email"]

    def __str__(self) -> str:
        return self.username
