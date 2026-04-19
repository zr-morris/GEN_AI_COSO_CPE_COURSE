"""DRF views for the public course catalog.

Read-only — content is authored in Wagtail, not via the API. Anonymous access
is allowed so the React app can load the catalog before the learner signs in.
"""

from __future__ import annotations

from typing import ClassVar

from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.response import Response

from .models import CoursePage
from .serializers import CourseDetailSerializer, CourseSummarySerializer


class CourseCatalogViewSet(viewsets.ViewSet):
    """`GET /api/courses/` and `GET /api/courses/<slug>/`.

    Catalog browsing is open; learner-state writes (in `apps.progress`) require
    authentication.
    """

    permission_classes: ClassVar[list] = [permissions.AllowAny]
    lookup_field = "slug"

    def _live_courses(self):
        return CoursePage.objects.live().order_by("path")

    def list(self, request):
        courses = self._live_courses()
        return Response(CourseSummarySerializer(courses, many=True).data)

    def retrieve(self, request, slug: str):
        course = get_object_or_404(self._live_courses(), slug=slug)
        return Response(CourseDetailSerializer(course).data)
