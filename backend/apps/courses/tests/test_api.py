"""Tests for the public course catalog API.

Verify shape so the React frontend can drop the API in as a replacement for
the hardcoded `src/data/courseContent.ts`.
"""

import pytest
from rest_framework.test import APIClient
from wagtail.models import Page

from apps.courses.models import (
    AssessmentPage,
    AssessmentQuestion,
    AssessmentQuestionOption,
    CourseIndexPage,
    CourseLearningObjective,
    CoursePage,
    EvaluationPage,
    EvaluationQuestion,
    ModulePage,
    ReviewPage,
    ReviewQuestion,
    ReviewQuestionOption,
)


@pytest.fixture
def api(db) -> APIClient:
    return APIClient()


@pytest.fixture
def populated_course(db) -> CoursePage:
    """A course with one of each child page type, populated with content."""
    root = Page.objects.get(depth=1)
    catalog = root.add_child(instance=CourseIndexPage(title="Catalog", slug="catalog"))

    course = catalog.add_child(
        instance=CoursePage(
            title="Test Course",
            slug="test-course",
            subtitle="A subtitle",
            description="<p>A description.</p>",
            cpe_credits=2.5,
            passing_score=80,
        )
    )
    CourseLearningObjective.objects.create(course=course, text="Objective one")
    CourseLearningObjective.objects.create(course=course, text="Objective two")

    module = course.add_child(
        instance=ModulePage(
            title="Module 1",
            slug="module-1",
            description="<p>Module description.</p>",
            sections=[
                (
                    "section",
                    {
                        "title": "Intro",
                        "content": [
                            ("paragraph", "<p>Hello.</p>"),
                            (
                                "callout",
                                {
                                    "title": "Heads up",
                                    "body": "<p>Watch this.</p>",
                                    "variant": "tip",
                                },
                            ),
                        ],
                    },
                ),
            ],
        )
    )
    module.save_revision().publish()

    review = course.add_child(instance=ReviewPage(title="Review 1", slug="review-1"))
    rq = ReviewQuestion.objects.create(
        review=review,
        text="<p>Q?</p>",
        correct_answer="b",
        feedback_correct="<p>yes</p>",
        feedback_incorrect="<p>no</p>",
        explanation="<p>because</p>",
    )
    for key in ["a", "b", "c"]:
        ReviewQuestionOption.objects.create(question=rq, key=key, text=f"option {key}")

    assessment = course.add_child(instance=AssessmentPage(title="Assessment", slug="assessment"))
    aq = AssessmentQuestion.objects.create(
        assessment=assessment,
        text="<p>Final Q?</p>",
        correct_answer="a",
        explanation="<p>because</p>",
        module_reference="Module 1 — Intro",
    )
    AssessmentQuestionOption.objects.create(question=aq, key="a", text="x")
    AssessmentQuestionOption.objects.create(question=aq, key="b", text="y")

    evaluation = course.add_child(instance=EvaluationPage(title="Evaluation", slug="evaluation"))
    EvaluationQuestion.objects.create(
        evaluation=evaluation, text="Was it useful?", question_type="likert"
    )
    EvaluationQuestion.objects.create(
        evaluation=evaluation, text="Other thoughts?", question_type="text"
    )

    return course


@pytest.mark.django_db
def test_catalog_list_is_open_and_returns_summary(api, populated_course):
    response = api.get("/api/courses/")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    summary = body[0]
    assert summary["slug"] == "test-course"
    assert summary["title"] == "Test Course"
    assert summary["cpeCredits"] == 2.5
    assert summary["passingScore"] == 80
    assert summary["url"] == "/api/courses/test-course/"


@pytest.mark.django_db
def test_course_detail_shape_matches_frontend(api, populated_course):
    response = api.get("/api/courses/test-course/")
    assert response.status_code == 200
    body = response.json()

    # Top-level scalar fields (camelCase, matching CourseData).
    assert body["slug"] == "test-course"
    assert body["title"] == "Test Course"
    assert body["subtitle"] == "A subtitle"
    assert body["cpeCredits"] == 2.5
    assert body["passingScore"] == 80
    assert body["totalAssessmentQuestions"] == 1
    assert body["learningObjectives"] == ["Objective one", "Objective two"]


@pytest.mark.django_db
def test_course_detail_module_serialization(api, populated_course):
    body = api.get("/api/courses/test-course/").json()

    assert len(body["modules"]) == 1
    module = body["modules"][0]
    assert module["id"] == "module-1"
    assert module["title"] == "Module 1"
    assert module["learningObjectives"] == []  # none added in fixture

    sections = module["sections"]
    assert len(sections) == 1
    section = sections[0]
    assert section["title"] == "Intro"

    blocks = section["content"]
    assert blocks[0]["type"] == "paragraph"
    assert blocks[0]["value"] == "<p>Hello.</p>"
    assert blocks[1]["type"] == "callout"
    assert blocks[1]["value"]["variant"] == "tip"
    assert blocks[1]["value"]["title"] == "Heads up"


@pytest.mark.django_db
def test_course_detail_review_questions_keyed_by_slug(api, populated_course):
    body = api.get("/api/courses/test-course/").json()

    review_questions = body["reviewQuestions"]
    assert "review-1" in review_questions
    questions = review_questions["review-1"]
    assert len(questions) == 1
    q = questions[0]
    assert q["correctAnswer"] == "b"
    assert q["feedback"] == {"correct": "<p>yes</p>", "incorrect": "<p>no</p>"}
    assert [o["id"] for o in q["options"]] == ["a", "b", "c"]


@pytest.mark.django_db
def test_course_detail_assessment_and_evaluation(api, populated_course):
    body = api.get("/api/courses/test-course/").json()

    assert len(body["assessmentQuestions"]) == 1
    aq = body["assessmentQuestions"][0]
    assert aq["correctAnswer"] == "a"
    assert aq["moduleReference"] == "Module 1 — Intro"
    assert [o["id"] for o in aq["options"]] == ["a", "b"]

    eqs = body["evaluationQuestions"]
    assert [q["type"] for q in eqs] == ["likert", "text"]


@pytest.mark.django_db
def test_unknown_course_is_404(api, populated_course):
    assert api.get("/api/courses/no-such-course/").status_code == 404


@pytest.mark.django_db
def test_unpublished_course_excluded(api, populated_course):
    """Live() filter must hide unpublished courses from the public catalog."""
    catalog = CourseIndexPage.objects.first()
    draft = catalog.add_child(
        instance=CoursePage(title="Draft", slug="draft-course", description="<p>x</p>", live=False)
    )
    draft.save()

    body = api.get("/api/courses/").json()
    slugs = [c["slug"] for c in body]
    assert "draft-course" not in slugs
    assert api.get("/api/courses/draft-course/").status_code == 404
