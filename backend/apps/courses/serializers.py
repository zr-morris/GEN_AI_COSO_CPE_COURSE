"""DRF serializers for the course catalog API.

Output shape mirrors the frontend's `CourseData` interface in
src/data/courseContent.ts so the React app can drop the API in as a replacement
for the hardcoded module without rewriting components. Fields are camelCase on
the wire (via `source=` mappings); the underlying models stay snake_case.

StreamField content is serialized as `[{type, value}, ...]` — Wagtail blocks
expose `get_api_representation(value)` which already returns JSON-friendly data
for each block type.
"""

from __future__ import annotations

from typing import Any, ClassVar

from rest_framework import serializers
from wagtail.fields import StreamValue

from .models import (
    AssessmentPage,
    AssessmentQuestion,
    CoursePage,
    EvaluationPage,
    EvaluationQuestion,
    ModulePage,
    ReviewPage,
    ReviewQuestion,
)


def serialize_streamfield(value: StreamValue) -> list[dict[str, Any]]:
    """Convert a Wagtail StreamValue into a list of `{type, value}` dicts."""
    return [
        {"type": child.block_type, "value": child.block.get_api_representation(child.value)}
        for child in value
    ]


# ---------------------------------------------------------------------------
# Catalog (list view)
# ---------------------------------------------------------------------------


class CourseSummarySerializer(serializers.ModelSerializer):
    """Lean shape for the catalog list endpoint."""

    cpeCredits = serializers.DecimalField(
        source="cpe_credits",
        max_digits=4,
        decimal_places=1,
        coerce_to_string=False,
    )
    passingScore = serializers.IntegerField(source="passing_score")
    url = serializers.SerializerMethodField()

    class Meta:
        model = CoursePage
        fields: ClassVar[list[str]] = [
            "slug",
            "title",
            "subtitle",
            "description",
            "cpeCredits",
            "passingScore",
            "url",
        ]

    def get_url(self, obj: CoursePage) -> str:
        return f"/api/courses/{obj.slug}/"


# ---------------------------------------------------------------------------
# Module
# ---------------------------------------------------------------------------


class LearningObjectiveSerializer(serializers.Serializer):
    """Shared shape for both course-level and module-level objectives."""

    id = serializers.SerializerMethodField()
    text = serializers.CharField()

    def get_id(self, obj) -> str:
        return f"lo-{obj.pk}"


class ModuleSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug")
    learningObjectives = LearningObjectiveSerializer(source="learning_objectives", many=True)
    sections = serializers.SerializerMethodField()

    class Meta:
        model = ModulePage
        fields: ClassVar[list[str]] = [
            "id",
            "title",
            "description",
            "learningObjectives",
            "sections",
        ]

    def get_sections(self, obj: ModulePage) -> list[dict[str, Any]]:
        out = []
        for child in obj.sections:
            section_value = child.value
            out.append(
                {
                    "title": section_value["title"],
                    "content": serialize_streamfield(section_value["content"]),
                }
            )
        return out


# ---------------------------------------------------------------------------
# Review (knowledge check)
# ---------------------------------------------------------------------------


class QuestionOptionSerializer(serializers.Serializer):
    id = serializers.CharField(source="key")
    text = serializers.CharField()


class ReviewQuestionSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    question = serializers.CharField(source="text")
    options = QuestionOptionSerializer(many=True)
    correctAnswer = serializers.CharField(source="correct_answer")
    feedback = serializers.SerializerMethodField()
    explanation = serializers.CharField()

    class Meta:
        model = ReviewQuestion
        fields: ClassVar[list[str]] = [
            "id",
            "question",
            "options",
            "correctAnswer",
            "feedback",
            "explanation",
        ]

    def get_id(self, obj: ReviewQuestion) -> str:
        return f"rq-{obj.pk}"

    def get_feedback(self, obj: ReviewQuestion) -> dict[str, str]:
        return {"correct": obj.feedback_correct, "incorrect": obj.feedback_incorrect}


# ---------------------------------------------------------------------------
# Assessment
# ---------------------------------------------------------------------------


class AssessmentQuestionSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    question = serializers.CharField(source="text")
    options = QuestionOptionSerializer(many=True)
    correctAnswer = serializers.CharField(source="correct_answer")
    moduleReference = serializers.CharField(source="module_reference")
    explanation = serializers.CharField()

    class Meta:
        model = AssessmentQuestion
        fields: ClassVar[list[str]] = [
            "id",
            "question",
            "options",
            "correctAnswer",
            "explanation",
            "moduleReference",
        ]

    def get_id(self, obj: AssessmentQuestion) -> str:
        return f"aq-{obj.pk}"


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------


class EvaluationQuestionSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    question = serializers.CharField(source="text")
    type = serializers.CharField(source="question_type")

    class Meta:
        model = EvaluationQuestion
        fields: ClassVar[list[str]] = ["id", "question", "type"]

    def get_id(self, obj: EvaluationQuestion) -> str:
        return f"eq-{obj.pk}"


# ---------------------------------------------------------------------------
# Full course detail (matches CourseData on the frontend)
# ---------------------------------------------------------------------------


class CourseDetailSerializer(serializers.ModelSerializer):
    cpeCredits = serializers.DecimalField(
        source="cpe_credits",
        max_digits=4,
        decimal_places=1,
        coerce_to_string=False,
    )
    passingScore = serializers.IntegerField(source="passing_score")
    learningObjectives = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()
    reviewQuestions = serializers.SerializerMethodField()
    assessmentQuestions = serializers.SerializerMethodField()
    evaluationQuestions = serializers.SerializerMethodField()
    totalAssessmentQuestions = serializers.SerializerMethodField()

    class Meta:
        model = CoursePage
        fields: ClassVar[list[str]] = [
            "slug",
            "title",
            "subtitle",
            "description",
            "cpeCredits",
            "passingScore",
            "totalAssessmentQuestions",
            "learningObjectives",
            "modules",
            "reviewQuestions",
            "assessmentQuestions",
            "evaluationQuestions",
        ]

    def get_learningObjectives(self, obj: CoursePage) -> list[str]:
        return [lo.text for lo in obj.learning_objectives.all()]

    def _modules(self, obj: CoursePage) -> list[ModulePage]:
        return list(
            ModulePage.objects.child_of(obj).live().order_by("path").specific(),
        )

    def _reviews(self, obj: CoursePage) -> list[ReviewPage]:
        return list(
            ReviewPage.objects.child_of(obj).live().order_by("path").specific(),
        )

    def get_modules(self, obj: CoursePage) -> list[dict[str, Any]]:
        return ModuleSerializer(self._modules(obj), many=True).data

    def get_reviewQuestions(self, obj: CoursePage) -> dict[str, list[dict[str, Any]]]:
        out: dict[str, list[dict[str, Any]]] = {}
        for review in self._reviews(obj):
            out[review.slug] = ReviewQuestionSerializer(review.questions.all(), many=True).data
        return out

    def _assessment(self, obj: CoursePage) -> AssessmentPage | None:
        return AssessmentPage.objects.child_of(obj).live().order_by("path").specific().first()

    def get_assessmentQuestions(self, obj: CoursePage) -> list[dict[str, Any]]:
        assessment = self._assessment(obj)
        if assessment is None:
            return []
        return AssessmentQuestionSerializer(assessment.questions.all(), many=True).data

    def get_totalAssessmentQuestions(self, obj: CoursePage) -> int:
        assessment = self._assessment(obj)
        return assessment.questions.count() if assessment else 0

    def get_evaluationQuestions(self, obj: CoursePage) -> list[dict[str, Any]]:
        evaluation = EvaluationPage.objects.child_of(obj).live().order_by("path").specific().first()
        if evaluation is None:
            return []
        return EvaluationQuestionSerializer(evaluation.questions.all(), many=True).data
