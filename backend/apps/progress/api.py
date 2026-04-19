"""DRF views for learner progress.

Routes (mounted at `/api/progress/`):

- `GET  /api/progress/`                 → list all progress for the current user
- `GET  /api/progress/<course_slug>/`   → progress for one course
- `PUT  /api/progress/<course_slug>/`   → upsert progress for that course

Authentication is required — anonymous calls get 401.
"""

from __future__ import annotations

from typing import ClassVar

from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from .models import CourseProgress
from .serializers import CourseProgressSerializer


class CourseProgressViewSet(viewsets.ViewSet):
    permission_classes: ClassVar[list] = [permissions.IsAuthenticated]
    lookup_field = "course_slug"

    def _queryset(self, request):
        return CourseProgress.objects.filter(user=request.user)

    def list(self, request):
        return Response(CourseProgressSerializer(self._queryset(request), many=True).data)

    def retrieve(self, request, course_slug: str):
        progress = get_object_or_404(self._queryset(request), course_slug=course_slug)
        return Response(CourseProgressSerializer(progress).data)

    def update(self, request, course_slug: str):
        """PUT — upsert. Creates the row if it doesn't exist, replaces `payload` if it does."""
        payload = request.data.get("payload")
        if payload is None or not isinstance(payload, dict):
            return Response(
                {"detail": "`payload` must be an object."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        progress, created = CourseProgress.objects.update_or_create(
            user=request.user,
            course_slug=course_slug,
            defaults={"payload": payload},
        )
        return Response(
            CourseProgressSerializer(progress).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def destroy(self, request, course_slug: str):
        progress = get_object_or_404(self._queryset(request), course_slug=course_slug)
        progress.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
