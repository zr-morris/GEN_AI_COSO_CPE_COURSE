"""End-to-end test: the seed_demo_course management command produces a complete course tree."""

import pytest
from django.core.management import call_command

from apps.courses.models import (
    AssessmentPage,
    CourseIndexPage,
    CoursePage,
    EvaluationPage,
    ModulePage,
    ReviewPage,
)


@pytest.mark.django_db
def test_seed_creates_full_course_tree():
    call_command("seed_demo_course")

    assert CourseIndexPage.objects.count() == 1
    assert CoursePage.objects.count() == 1
    assert ModulePage.objects.count() == 3
    assert ReviewPage.objects.count() == 3
    assert AssessmentPage.objects.count() == 1
    assert EvaluationPage.objects.count() == 1

    course = CoursePage.objects.first()
    assert course.passing_score == 70
    assert course.learning_objectives.count() == 6

    # Each module carries 3 learning objectives and 3 sections.
    for module in ModulePage.objects.all():
        assert module.learning_objectives.count() == 3
        assert len(module.sections) == 3
        assert module.sections[0].value["title"]

    # Each review has 3 knowledge-check questions.
    for review in ReviewPage.objects.all():
        assert review.questions.count() == 3

    assessment = AssessmentPage.objects.first()
    assert assessment.questions.count() == 15

    evaluation = EvaluationPage.objects.first()
    assert evaluation.questions.count() == 5


@pytest.mark.django_db
def test_seed_is_idempotent():
    call_command("seed_demo_course")
    call_command("seed_demo_course")  # second run must not raise or duplicate
    assert CoursePage.objects.count() == 1
    assert ModulePage.objects.count() == 3


@pytest.mark.django_db
def test_seed_force_recreates():
    call_command("seed_demo_course")
    original_pk = CoursePage.objects.first().pk

    call_command("seed_demo_course", "--force")
    assert CoursePage.objects.count() == 1
    assert CoursePage.objects.first().pk != original_pk
    assert ModulePage.objects.count() == 3
