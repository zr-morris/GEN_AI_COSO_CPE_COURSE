import type { ContentBlock as ContentBlockData } from '../data/courseContent';

interface ContentBlockProps {
  block: ContentBlockData;
}

const calloutVariants = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'fa-info-circle text-blue-600',
    titleColor: 'text-blue-800',
  },
  tip: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'fa-lightbulb text-green-600',
    titleColor: 'text-green-800',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'fa-exclamation-triangle text-amber-600',
    titleColor: 'text-amber-800',
  },
  important: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'fa-exclamation-circle text-purple-600',
    titleColor: 'text-purple-800',
  },
} as const;

// The API returns rich-text fields as HTML strings (Wagtail `RichTextBlock`
// output). We render them through `dangerouslySetInnerHTML` so inline emphasis
// from the CMS makes it to the page; the surrounding wrapper keeps our
// typography classes. SMEs authoring in Wagtail cannot inject raw <script> —
// RichTextField's default allowlist strips them.
function richHtml(content: string | undefined): { __html: string } {
  return { __html: content ?? '' };
}

export function ContentBlock({ block }: ContentBlockProps) {
  switch (block.type) {
    case 'paragraph':
      return (
        <div
          className="text-sm text-gray-700 leading-relaxed mb-4 [&_p]:mb-3 [&_p:last-child]:mb-0"
          dangerouslySetInnerHTML={richHtml(block.content)}
        />
      );

    case 'heading':
      return (
        <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">
          {block.content}
        </h3>
      );

    case 'callout': {
      const v = calloutVariants[block.variant ?? 'info'];
      return (
        <aside
          role="note"
          className={`${v.bg} ${v.border} border rounded-xl p-4 mb-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <i className={`fas ${v.icon}`} aria-hidden="true"></i>
            <span className={`text-sm font-semibold ${v.titleColor}`}>
              {block.title}
            </span>
          </div>
          <div
            className="text-sm text-gray-700 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={richHtml(block.content)}
          />
        </aside>
      );
    }

    case 'example':
      return (
        <aside
          role="note"
          className="bg-kpmg-blue/5 border border-kpmg-blue/15 rounded-xl p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-flask text-kpmg-blue" aria-hidden="true"></i>
            <span className="text-sm font-semibold text-kpmg-blue">
              {block.title}
            </span>
          </div>
          <div
            className="text-sm text-gray-700 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={richHtml(block.content)}
          />
        </aside>
      );

    case 'warning':
      return (
        <aside
          role="note"
          className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <i
              className="fas fa-exclamation-triangle text-red-600"
              aria-hidden="true"
            ></i>
            <span className="text-sm font-semibold text-red-800">
              {block.title}
            </span>
          </div>
          <div
            className="text-sm text-gray-700 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={richHtml(block.content)}
          />
        </aside>
      );

    case 'table':
      return (
        <div className="overflow-x-auto mb-4 rounded-xl border border-kpmg-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-kpmg-blue/5">
                {block.headers?.map((header, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="text-left px-4 py-3 font-semibold text-kpmg-blue border-b border-kpmg-border"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-gray-700 border-b border-kpmg-border/50"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'list':
      return (
        <ul className="space-y-2 mb-4 ml-1">
          {block.items?.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-gray-700"
            >
              <i
                className="fas fa-chevron-right text-kpmg-blue text-[10px] mt-1.5 flex-shrink-0"
                aria-hidden="true"
              ></i>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );

    default:
      return null;
  }
}
