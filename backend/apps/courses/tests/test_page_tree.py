"""Page-tree structural tests.

Verify that:
- Each page model declares the right parent/subpage types so SMEs cannot create
  invalid hierarchies in the Wagtail admin (e.g. an AssessmentPage outside a CoursePage).
- The full hierarchy can be built end-to-end through the ORM.
"""

import pytest
from wagtail.models import Page

from apps.courses.models import (
    AssessmentPage,
    CourseIndexPage,
    CoursePage,
    EvaluationPage,
    ModulePage,
    ReviewPage,
)


def _root_page() -> Page:
    return Page.objects.get(depth=1)


@pytest.mark.django_db
class TestPageTypeRestrictions:
    def test_course_index_lives_under_root(self):
        assert "wagtailcore.Page" in CourseIndexPage.parent_page_types
        assert CourseIndexPage.subpage_types == ["courses.CoursePage"]

    def test_course_lives_under_index(self):
        assert CoursePage.parent_page_types == ["courses.CourseIndexPage"]
        assert set(CoursePage.subpage_types) == {
            "courses.ModulePage",
            "courses.ReviewPage",
            "courses.AssessmentPage",
            "courses.EvaluationPage",
        }

    @pytest.mark.parametrize("model", [ModulePage, ReviewPage, AssessmentPage, EvaluationPage])
    def test_leaf_pages_only_under_course(self, model):
        assert model.parent_page_types == ["courses.CoursePage"]
        assert model.subpage_types == []


@pytest.mark.django_db
class TestPageTreeCreation:
    def test_full_hierarchy_can_be_built(self):
        root = _root_page()
        catalog = root.add_child(instance=CourseIndexPage(title="Catalog", slug="catalog"))
        course = catalog.add_child(
            instance=CoursePage(
                title="Test Course",
                slug="test",
                description="<p>Hi</p>",
                cpe_credits=1,
                passing_score=70,
            )
        )
        module = course.add_child(
            instance=ModulePage(title="Mod 1", slug="m1", description="<p>x</p>")
        )
        review = course.add_child(instance=ReviewPage(title="Review 1", slug="r1"))
        assessment = course.add_child(instance=AssessmentPage(title="Assess", slug="a"))
        evaluation = course.add_child(instance=EvaluationPage(title="Eval", slug="e"))

        assert course.get_children().count() == 4
        assert {p.specific_class for p in course.get_children()} == {
            ModulePage,
            ReviewPage,
            AssessmentPage,
            EvaluationPage,
        }
        # Sanity: each leaf knows its parent.
        for leaf in (module, review, assessment, evaluation):
            assert leaf.get_parent().specific == course
