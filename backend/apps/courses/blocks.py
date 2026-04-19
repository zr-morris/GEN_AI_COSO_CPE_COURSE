"""StreamField blocks for course content.

Each block here corresponds to a `type` value in the frontend's `ContentBlock`
discriminated union (see src/data/courseContent.ts). Keep this file in sync with
the frontend renderer in src/components/ContentBlock.tsx — when adding a new
block type, add the renderer too.
"""

from typing import ClassVar

from wagtail import blocks
from wagtail.blocks import (
    CharBlock,
    ChoiceBlock,
    ListBlock,
    RichTextBlock,
    StreamBlock,
    StructBlock,
)


class ParagraphBlock(RichTextBlock):
    class Meta:
        icon = "pilcrow"
        label = "Paragraph"
        template = "courses/blocks/paragraph.html"


class HeadingBlock(CharBlock):
    class Meta:
        icon = "title"
        label = "Heading"
        template = "courses/blocks/heading.html"


class CalloutBlock(StructBlock):
    """A highlighted aside — the variant maps to a colored card on the frontend."""

    title = CharBlock(required=True, max_length=120)
    body = blocks.RichTextBlock(required=True)
    variant = ChoiceBlock(
        choices=[
            ("info", "Info"),
            ("tip", "Tip"),
            ("warning", "Warning"),
            ("important", "Important"),
        ],
        default="info",
    )

    class Meta:
        icon = "help"
        label = "Callout"
        template = "courses/blocks/callout.html"


class ExampleBlock(StructBlock):
    title = CharBlock(required=True, max_length=120, default="Example")
    body = blocks.RichTextBlock(required=True)

    class Meta:
        icon = "doc-full"
        label = "Example"
        template = "courses/blocks/example.html"


class WarningBlock(StructBlock):
    title = CharBlock(required=True, max_length=120, default="Important")
    body = blocks.RichTextBlock(required=True)

    class Meta:
        icon = "warning"
        label = "Warning"
        template = "courses/blocks/warning.html"


class TableBlock(StructBlock):
    """A simple uniform-grid table.

    Rows is a list of pipe-delimited strings — one row per item, cells separated
    by `|`. Wagtail also has wagtail.contrib.table_block.TableBlock which gives a
    spreadsheet-style editor; we may swap to it once the API serializer is in
    place. For now this is simpler and round-trips cleanly to JSON.
    """

    headers = ListBlock(CharBlock(max_length=120, label="Header"))
    rows = ListBlock(
        ListBlock(CharBlock(label="Cell"), label="Row"),
        label="Rows",
    )

    class Meta:
        icon = "table"
        label = "Table"
        template = "courses/blocks/table.html"


class BulletListBlock(StructBlock):
    items = ListBlock(CharBlock(max_length=500, label="Item"))

    class Meta:
        icon = "list-ul"
        label = "Bulleted list"
        template = "courses/blocks/list.html"


class ContentStreamBlock(StreamBlock):
    """The set of blocks an SME can drop into a module section.

    Adding a new type here automatically exposes it in Wagtail's block editor.
    """

    paragraph = ParagraphBlock()
    heading = HeadingBlock()
    callout = CalloutBlock()
    example = ExampleBlock()
    warning = WarningBlock()
    table = TableBlock()
    bullet_list = BulletListBlock()

    class Meta:
        block_counts: ClassVar[dict] = {
            "heading": {"max_num": 20},
        }


class ModuleSectionBlock(StructBlock):
    """A titled section inside a module — title + a stream of content blocks."""

    title = CharBlock(required=True, max_length=200)
    content = ContentStreamBlock(required=True)

    class Meta:
        icon = "doc-empty"
        label = "Section"
        template = "courses/blocks/section.html"
