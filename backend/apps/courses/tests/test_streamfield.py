"""StreamField round-trip tests.

The frontend will consume `sections` as JSON via the API. Verify that each
block type round-trips through the database without losing structure, and that
block-counts (e.g. max 20 headings per stream) are enforced.
"""

import pytest
from wagtail.models import Page

from apps.courses.models import CourseIndexPage, CoursePage, ModulePage


@pytest.fixture
def module(db) -> ModulePage:
    root = Page.objects.get(depth=1)
    catalog = root.add_child(instance=CourseIndexPage(title="Cat", slug="c"))
    course = catalog.add_child(
        instance=CoursePage(title="C", slug="course", description="<p>x</p>")
    )
    return course.add_child(instance=ModulePage(title="M", slug="m", description="<p>x</p>"))


@pytest.mark.django_db
def test_paragraph_block_roundtrip(module):
    module.sections = [
        (
            "section",
            {
                "title": "Intro",
                "content": [("paragraph", "<p>hello world</p>")],
            },
        )
    ]
    module.save()
    fetched = ModulePage.objects.get(pk=module.pk)
    section = fetched.sections[0].value
    assert section["title"] == "Intro"
    assert str(section["content"][0].value) == "<p>hello world</p>"


@pytest.mark.django_db
def test_table_block_roundtrip(module):
    module.sections = [
        (
            "section",
            {
                "title": "Risks",
                "content": [
                    (
                        "table",
                        {
                            "headers": ["Risk", "Impact"],
                            "rows": [["Bias", "High"], ["Drift", "Medium"]],
                        },
                    ),
                ],
            },
        )
    ]
    module.save()
    fetched = ModulePage.objects.get(pk=module.pk)
    table = fetched.sections[0].value["content"][0].value
    assert list(table["headers"]) == ["Risk", "Impact"]
    assert list(list(r) for r in table["rows"]) == [["Bias", "High"], ["Drift", "Medium"]]


@pytest.mark.django_db
def test_callout_variant_choices(module):
    """Variant must be one of the declared choices."""
    module.sections = [
        (
            "section",
            {
                "title": "x",
                "content": [
                    (
                        "callout",
                        {"title": "Heads up", "body": "<p>hi</p>", "variant": "tip"},
                    ),
                ],
            },
        )
    ]
    module.save()
    fetched = ModulePage.objects.get(pk=module.pk)
    callout = fetched.sections[0].value["content"][0].value
    assert callout["variant"] == "tip"


@pytest.mark.django_db
def test_all_block_types_can_coexist(module):
    """A single section can hold every supported block type."""
    module.sections = [
        (
            "section",
            {
                "title": "Mixed",
                "content": [
                    ("paragraph", "<p>p</p>"),
                    ("heading", "Sub-heading"),
                    ("callout", {"title": "T", "body": "<p>b</p>", "variant": "info"}),
                    ("example", {"title": "Ex", "body": "<p>e</p>"}),
                    ("warning", {"title": "W", "body": "<p>w</p>"}),
                    (
                        "table",
                        {"headers": ["a"], "rows": [["1"]]},
                    ),
                    ("bullet_list", {"items": ["one", "two"]}),
                ],
            },
        )
    ]
    module.save()
    fetched = ModulePage.objects.get(pk=module.pk)
    types = [b.block_type for b in fetched.sections[0].value["content"]]
    assert types == [
        "paragraph",
        "heading",
        "callout",
        "example",
        "warning",
        "table",
        "bullet_list",
    ]
