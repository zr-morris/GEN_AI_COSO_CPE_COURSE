"""Serializer for the learner progress API.

The `payload` field is opaque JSON — the frontend defines its shape. We only
guarantee that what comes in is what goes back out.
"""

from typing import ClassVar

from rest_framework import serializers

from .models import CourseProgress


class CourseProgressSerializer(serializers.ModelSerializer):
    courseSlug = serializers.SlugField(source="course_slug")
    startedAt = serializers.DateTimeField(source="started_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = CourseProgress
        fields: ClassVar[list[str]] = ["courseSlug", "payload", "startedAt", "updatedAt"]
