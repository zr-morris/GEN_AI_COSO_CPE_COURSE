"""Per-(user, course) learner progress.

The frontend's `CourseProgress` shape (see src/store/courseStore.ts) is stored
verbatim in the `payload` JSONField. The backend doesn't model individual
fields here because the frontend is authoritative for state transitions —
keeping the schema flexible avoids a migration every time the store evolves.

Only structural metadata (which user, which course, when) is indexed.
"""

from typing import ClassVar

from django.conf import settings
from django.db import models


class CourseProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_progress",
    )
    course_slug = models.SlugField(
        max_length=200,
        help_text="Slug of the CoursePage this progress belongs to.",
    )
    payload = models.JSONField(
        default=dict,
        help_text="Frontend-defined progress blob (mirrors CourseProgress in the React store).",
    )
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints: ClassVar[list] = [
            models.UniqueConstraint(
                fields=["user", "course_slug"], name="unique_user_course_progress"
            ),
        ]
        indexes: ClassVar[list] = [models.Index(fields=["user", "course_slug"])]
        verbose_name = "Course progress"
        verbose_name_plural = "Course progress"

    def __str__(self) -> str:
        return f"{self.user} — {self.course_slug}"
