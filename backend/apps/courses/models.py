"""Wagtail page models for the course catalog.

Page hierarchy:

    CourseIndexPage (catalog root — one per site)
    └── CoursePage
        ├── ModulePage    (multiple, ordered)
        ├── ReviewPage    (typically one per module)
        ├── AssessmentPage (one per course)
        └── EvaluationPage (one per course)

The frontend consumes these via the DRF API (milestone 2C).
"""

from typing import ClassVar

from django.db import models
from modelcluster.fields import ParentalKey
from modelcluster.models import ClusterableModel
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.fields import RichTextField, StreamField
from wagtail.models import Orderable, Page

from .blocks import ModuleSectionBlock

# ---------------------------------------------------------------------------
# Catalog root and course
# ---------------------------------------------------------------------------


class CourseIndexPage(Page):
    """Top of the catalog. Children are CoursePages.

    Only one is expected per site, but Wagtail does not enforce that — if you
    need multiple catalogs, just create more.
    """

    intro = RichTextField(blank=True)

    content_panels: ClassVar[list] = [*Page.content_panels, FieldPanel("intro")]

    subpage_types: ClassVar[list[str]] = ["courses.CoursePage"]
    parent_page_types: ClassVar[list[str]] = ["wagtailcore.Page"]

    class Meta:
        verbose_name = "Course catalog"


class CoursePage(Page):
    """A single course. Children are the ordered sequence of module/review/assessment/evaluation pages."""

    subtitle = models.CharField(max_length=255, blank=True)
    description = RichTextField()
    cpe_credits = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        default=1.0,
        help_text="Credits awarded on completion. Informational for internal training.",
    )
    passing_score = models.PositiveSmallIntegerField(
        default=70,
        help_text="Minimum percentage required to pass the assessment.",
    )

    content_panels: ClassVar[list] = [
        *Page.content_panels,
        FieldPanel("subtitle"),
        FieldPanel("description"),
        MultiFieldPanel(
            [FieldPanel("cpe_credits"), FieldPanel("passing_score")],
            heading="Credit & scoring",
        ),
        InlinePanel("learning_objectives", label="Course-level learning objectives"),
    ]

    subpage_types: ClassVar[list[str]] = [
        "courses.ModulePage",
        "courses.ReviewPage",
        "courses.AssessmentPage",
        "courses.EvaluationPage",
    ]
    parent_page_types: ClassVar[list[str]] = ["courses.CourseIndexPage"]

    class Meta:
        verbose_name = "Course"


class CourseLearningObjective(Orderable):
    course = ParentalKey(CoursePage, related_name="learning_objectives")
    text = models.CharField(max_length=500)

    panels: ClassVar[list] = [FieldPanel("text")]

    def __str__(self) -> str:
        return self.text


# ---------------------------------------------------------------------------
# Module
# ---------------------------------------------------------------------------


class ModulePage(Page):
    """A teaching module — description, learning objectives, and a stream of titled sections."""

    description = RichTextField()
    sections = StreamField(
        [("section", ModuleSectionBlock())],
        use_json_field=True,
        blank=True,
        help_text="Add titled sections, then drop content blocks (paragraph, callout, table, etc.) into each.",
    )

    content_panels: ClassVar[list] = [
        *Page.content_panels,
        FieldPanel("description"),
        InlinePanel("learning_objectives", label="Learning objectives"),
        FieldPanel("sections"),
    ]

    subpage_types: ClassVar[list] = []
    parent_page_types: ClassVar[list[str]] = ["courses.CoursePage"]

    class Meta:
        verbose_name = "Module"


class ModuleLearningObjective(Orderable):
    module = ParentalKey(ModulePage, related_name="learning_objectives")
    text = models.CharField(max_length=500)

    panels: ClassVar[list] = [FieldPanel("text")]

    def __str__(self) -> str:
        return self.text


# ---------------------------------------------------------------------------
# Review (knowledge check) and Assessment (graded)
# ---------------------------------------------------------------------------

OPTION_CHOICES = [(c, c.upper()) for c in ("a", "b", "c", "d", "e")]


class ReviewPage(Page):
    """Ungraded knowledge check that follows a module.

    Questions are added inline as orderable children.
    """

    intro = RichTextField(blank=True)

    content_panels: ClassVar[list] = [
        *Page.content_panels,
        FieldPanel("intro"),
        InlinePanel("questions", label="Questions"),
    ]

    subpage_types: ClassVar[list] = []
    parent_page_types: ClassVar[list[str]] = ["courses.CoursePage"]

    class Meta:
        verbose_name = "Review (knowledge check)"


class ReviewQuestion(ClusterableModel, Orderable):
    review = ParentalKey(ReviewPage, related_name="questions")
    text = RichTextField()
    correct_answer = models.CharField(max_length=1, choices=OPTION_CHOICES)
    feedback_correct = RichTextField(help_text="Shown when the learner picks the right option.")
    feedback_incorrect = RichTextField(help_text="Shown when the learner picks a wrong option.")
    explanation = RichTextField(help_text="Always shown after the answer is locked.")

    panels: ClassVar[list] = [
        FieldPanel("text"),
        InlinePanel("options", label="Answer options", min_num=2, max_num=5),
        FieldPanel("correct_answer"),
        FieldPanel("feedback_correct"),
        FieldPanel("feedback_incorrect"),
        FieldPanel("explanation"),
    ]

    class Meta(Orderable.Meta):
        verbose_name = "Review question"


class ReviewQuestionOption(Orderable):
    question = ParentalKey(ReviewQuestion, related_name="options")
    key = models.CharField(max_length=1, choices=OPTION_CHOICES)
    text = models.CharField(max_length=500)

    panels: ClassVar[list] = [FieldPanel("key"), FieldPanel("text")]

    class Meta(Orderable.Meta):
        verbose_name = "Answer option"


class AssessmentPage(Page):
    """Final graded assessment — passing the assessment unlocks the evaluation."""

    intro = RichTextField(blank=True)
    time_limit_minutes = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Optional. Leave blank for untimed.",
    )

    content_panels: ClassVar[list] = [
        *Page.content_panels,
        FieldPanel("intro"),
        FieldPanel("time_limit_minutes"),
        InlinePanel("questions", label="Questions"),
    ]

    subpage_types: ClassVar[list] = []
    parent_page_types: ClassVar[list[str]] = ["courses.CoursePage"]

    class Meta:
        verbose_name = "Assessment"


class AssessmentQuestion(ClusterableModel, Orderable):
    assessment = ParentalKey(AssessmentPage, related_name="questions")
    text = RichTextField()
    correct_answer = models.CharField(max_length=1, choices=OPTION_CHOICES)
    explanation = RichTextField()
    module_reference = models.CharField(
        max_length=200,
        blank=True,
        help_text="Free-text reference back to the source module (e.g. 'Module 1 — Section 2').",
    )

    panels: ClassVar[list] = [
        FieldPanel("text"),
        InlinePanel("options", label="Answer options", min_num=2, max_num=5),
        FieldPanel("correct_answer"),
        FieldPanel("explanation"),
        FieldPanel("module_reference"),
    ]

    class Meta(Orderable.Meta):
        verbose_name = "Assessment question"


class AssessmentQuestionOption(Orderable):
    question = ParentalKey(AssessmentQuestion, related_name="options")
    key = models.CharField(max_length=1, choices=OPTION_CHOICES)
    text = models.CharField(max_length=500)

    panels: ClassVar[list] = [FieldPanel("key"), FieldPanel("text")]

    class Meta(Orderable.Meta):
        verbose_name = "Answer option"


# ---------------------------------------------------------------------------
# Evaluation (post-course survey)
# ---------------------------------------------------------------------------

QUESTION_TYPE_CHOICES = [
    ("likert", "Likert (1-5 rating)"),
    ("text", "Free-text response"),
]


class EvaluationPage(Page):
    """Post-course evaluation — likert ratings and free-text questions.

    Submitting the evaluation unlocks the certificate.
    """

    intro = RichTextField(blank=True)

    content_panels: ClassVar[list] = [
        *Page.content_panels,
        FieldPanel("intro"),
        InlinePanel("questions", label="Questions"),
    ]

    subpage_types: ClassVar[list] = []
    parent_page_types: ClassVar[list[str]] = ["courses.CoursePage"]

    class Meta:
        verbose_name = "Evaluation"


class EvaluationQuestion(Orderable):
    evaluation = ParentalKey(EvaluationPage, related_name="questions")
    text = models.CharField(max_length=500)
    question_type = models.CharField(
        max_length=10,
        choices=QUESTION_TYPE_CHOICES,
        default="likert",
    )

    panels: ClassVar[list] = [FieldPanel("text"), FieldPanel("question_type")]

    class Meta(Orderable.Meta):
        verbose_name = "Evaluation question"
