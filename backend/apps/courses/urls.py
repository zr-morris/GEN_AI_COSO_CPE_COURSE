"""URLConf for the courses API.

Mounted at `/api/courses/` from `config.urls`.
"""

from rest_framework.routers import DefaultRouter

from .api import CourseCatalogViewSet

router = DefaultRouter()
router.register(r"courses", CourseCatalogViewSet, basename="course")

urlpatterns = router.urls
