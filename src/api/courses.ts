// Fetch the course catalog from the backend and reshape it into the frontend's
// existing CourseData interface.
//
// The backend uses Wagtail StreamField semantics — each content block comes
// back as `{type, value}` where `value` is nested. The frontend's ContentBlock
// renderer expects a flat `{type, content?, items?, title?, variant?, ...}`
// discriminated union, so we normalize on the way in. Keeping the transform
// here means the rest of the app stays oblivious to the API shape.
//
// Also:
//  - backend module/review slugs use dashes (`module-1`, `review-1`); the
//    frontend's store/routing uses camelCase ids (`module1`, `review1`). We
//    strip the dash during transform.
//  - Rich text fields come back as HTML strings. For `description` fields that
//    the frontend renders as plain text we strip the outer `<p>...</p>`; for
//    ContentBlock body text we keep the HTML and render it via
//    `dangerouslySetInnerHTML` (see components/ContentBlock.tsx).

import { apiFetch } from './client';
import type {
  AssessmentQuestion,
  ContentBlock,
  CourseData,
  EvaluationQuestion,
  LearningObjective,
  ModuleData,
  ReviewQuestion,
} from '../data/courseContent';

const DEMO_COURSE_SLUG = 'coso-ai-internal-control';

// ---------------------------------------------------------------------------
// Raw API shape (what the backend literally sends over the wire)
// ---------------------------------------------------------------------------

interface ApiContentBlock {
  type: string;
  value: unknown;
}

interface ApiLearningObjective {
  id: string;
  text: string;
}

interface ApiModule {
  id: string;
  title: string;
  description: string;
  learningObjectives: ApiLearningObjective[];
  sections: {
    title: string;
    content: ApiContentBlock[];
  }[];
}

interface ApiQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  feedback?: { correct: string; incorrect: string };
  moduleReference?: string;
}

interface ApiEvaluationQuestion {
  id: string;
  question: string;
  type: 'likert' | 'text';
}

interface ApiCourseDetail {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cpeCredits: number;
  passingScore: number;
  totalAssessmentQuestions: number;
  learningObjectives: string[];
  modules: ApiModule[];
  reviewQuestions: Record<string, ApiQuestion[]>;
  assessmentQuestions: ApiQuestion[];
  evaluationQuestions: ApiEvaluationQuestion[];
}

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

/** Strip a single wrapping `<p>...</p>` plus any remaining tags for plain-text display. */
function htmlToPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/** `module-1` -> `module1`, `review-2` -> `review2`. */
function stripDash(slug: string): string {
  return slug.replace(/-/g, '');
}

function isStringRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function toContentBlock(raw: ApiContentBlock): ContentBlock | null {
  const { type, value } = raw;
  switch (type) {
    case 'paragraph':
      return { type: 'paragraph', content: typeof value === 'string' ? value : '' };

    case 'heading':
      return { type: 'heading', content: typeof value === 'string' ? value : '' };

    case 'callout': {
      if (!isStringRecord(value)) return null;
      const variant = (value.variant as ContentBlock['variant']) ?? 'info';
      return {
        type: 'callout',
        title: String(value.title ?? ''),
        content: String(value.body ?? ''),
        variant,
      };
    }

    case 'example': {
      if (!isStringRecord(value)) return null;
      return {
        type: 'example',
        title: String(value.title ?? 'Example'),
        content: String(value.body ?? ''),
      };
    }

    case 'warning': {
      if (!isStringRecord(value)) return null;
      return {
        type: 'warning',
        title: String(value.title ?? 'Important'),
        content: String(value.body ?? ''),
      };
    }

    case 'table': {
      if (!isStringRecord(value)) return null;
      const headers = Array.isArray(value.headers)
        ? (value.headers as unknown[]).map(String)
        : [];
      const rows = Array.isArray(value.rows)
        ? (value.rows as unknown[]).map((row) =>
            Array.isArray(row) ? (row as unknown[]).map(String) : [],
          )
        : [];
      return { type: 'table', headers, rows };
    }

    case 'bullet_list':
    case 'list': {
      if (!isStringRecord(value)) return null;
      const items = Array.isArray(value.items)
        ? (value.items as unknown[]).map(String)
        : [];
      return { type: 'list', items };
    }

    default:
      // Unknown block type — drop it rather than crash the page.
      if (import.meta.env.DEV) {
        console.warn(`[api/courses] dropping unknown block type: ${type}`);
      }
      return null;
  }
}

function toLearningObjectives(
  raw: ApiLearningObjective[],
): LearningObjective[] {
  return raw.map((lo) => ({ id: lo.id, text: lo.text }));
}

function toModule(raw: ApiModule): ModuleData {
  return {
    id: stripDash(raw.id),
    title: raw.title,
    description: htmlToPlainText(raw.description),
    learningObjectives: toLearningObjectives(raw.learningObjectives),
    sections: raw.sections.map((section) => ({
      title: section.title,
      content: section.content
        .map(toContentBlock)
        .filter((b): b is ContentBlock => b !== null),
    })),
  };
}

function toReviewQuestion(raw: ApiQuestion): ReviewQuestion {
  return {
    id: raw.id,
    question: htmlToPlainText(raw.question),
    options: raw.options.map((o) => ({ id: o.id, text: o.text })),
    correctAnswer: raw.correctAnswer,
    feedback: {
      correct: htmlToPlainText(raw.feedback?.correct ?? ''),
      incorrect: htmlToPlainText(raw.feedback?.incorrect ?? ''),
    },
    explanation: htmlToPlainText(raw.explanation),
  };
}

function toAssessmentQuestion(raw: ApiQuestion): AssessmentQuestion {
  return {
    id: raw.id,
    question: htmlToPlainText(raw.question),
    options: raw.options.map((o) => ({ id: o.id, text: o.text })),
    correctAnswer: raw.correctAnswer,
    explanation: htmlToPlainText(raw.explanation),
    moduleReference: raw.moduleReference ?? '',
  };
}

function toEvaluationQuestion(raw: ApiEvaluationQuestion): EvaluationQuestion {
  return { id: raw.id, question: raw.question, type: raw.type };
}

function toCourseData(raw: ApiCourseDetail): CourseData {
  const reviewQuestions: Record<string, ReviewQuestion[]> = {};
  for (const [slug, questions] of Object.entries(raw.reviewQuestions)) {
    reviewQuestions[stripDash(slug)] = questions.map(toReviewQuestion);
  }

  return {
    title: raw.title,
    subtitle: raw.subtitle,
    description: htmlToPlainText(raw.description),
    cpeCredits: raw.cpeCredits,
    passingScore: raw.passingScore,
    totalAssessmentQuestions: raw.totalAssessmentQuestions,
    learningObjectives: raw.learningObjectives,
    modules: raw.modules.map(toModule),
    reviewQuestions,
    assessmentQuestions: raw.assessmentQuestions.map(toAssessmentQuestion),
    evaluationQuestions: raw.evaluationQuestions.map(toEvaluationQuestion),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchCourse(
  slug: string = DEMO_COURSE_SLUG,
  signal?: AbortSignal,
): Promise<CourseData> {
  const raw = await apiFetch<ApiCourseDetail>(`/courses/${slug}/`, { signal });
  return toCourseData(raw);
}

export { DEMO_COURSE_SLUG };
