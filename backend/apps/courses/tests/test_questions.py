"""Tests for the orderable question/option models on Review and Assessment pages."""

import pytest
from wagtail.models import Page

from apps.courses.models import (
    AssessmentPage,
    AssessmentQuestion,
    AssessmentQuestionOption,
    CourseIndexPage,
    CoursePage,
    ReviewPage,
    ReviewQuestion,
    ReviewQuestionOption,
)


@pytest.fixture
def course(db) -> CoursePage:
    root = Page.objects.get(depth=1)
    catalog = root.add_child(instance=CourseIndexPage(title="C", slug="c"))
    return catalog.add_child(instance=CoursePage(title="X", slug="x", description="<p>x</p>"))


@pytest.mark.django_db
def test_review_question_with_ordered_options(course):
    review = course.add_child(instance=ReviewPage(title="R", slug="r"))
    q = ReviewQuestion.objects.create(
        review=review,
        text="<p>Q?</p>",
        correct_answer="b",
        feedback_correct="<p>yes</p>",
        feedback_incorrect="<p>no</p>",
        explanation="<p>because</p>",
    )
    for key in ["a", "b", "c", "d"]:
        ReviewQuestionOption.objects.create(question=q, key=key, text=f"option {key}")

    assert review.questions.count() == 1
    fetched_q = review.questions.first()
    assert [o.key for o in fetched_q.options.all()] == ["a", "b", "c", "d"]


@pytest.mark.django_db
def test_assessment_question_with_module_reference(course):
    assessment = course.add_child(instance=AssessmentPage(title="A", slug="a"))
    q = AssessmentQuestion.objects.create(
        assessment=assessment,
        text="<p>Q?</p>",
        correct_answer="a",
        explanation="<p>because</p>",
        module_reference="Module 2 — Risk Assessment",
    )
    AssessmentQuestionOption.objects.create(question=q, key="a", text="x")
    AssessmentQuestionOption.objects.create(question=q, key="b", text="y")

    fetched = assessment.questions.first()
    assert fetched.module_reference == "Module 2 — Risk Assessment"
    assert fetched.options.count() == 2
