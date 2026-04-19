from rest_framework.routers import DefaultRouter

from .api import CourseProgressViewSet

router = DefaultRouter()
router.register(r"progress", CourseProgressViewSet, basename="progress")

urlpatterns = router.urls
