from django.contrib import admin

from .models import CourseProgress


@admin.register(CourseProgress)
class CourseProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "course_slug", "started_at", "updated_at")
    list_filter = ("course_slug",)
    search_fields = ("user__username", "user__email", "course_slug")
    readonly_fields = ("started_at", "updated_at")
