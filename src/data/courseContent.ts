// src/data/courseContent.ts
//
// Types-only module describing the shape of a course. Course content itself
// now comes from the Wagtail-backed API — see src/api/courses.ts for the
// fetch + transform, and src/store/courseDataStore.tsx for the provider that
// makes it available to the component tree.
//
// The backend's `apps/courses/serializers.py` is kept aligned with these
// interfaces; if you change a field here, update the serializer too.

export interface LearningObjective {
  id: string;
  text: string;
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'callout' | 'example' | 'warning' | 'table' | 'list';
  content?: string;
  items?: string[];
  title?: string;
  variant?: 'info' | 'tip' | 'warning' | 'important';
  headers?: string[];
  rows?: string[][];
}

export interface ModuleData {
  id: string;
  title: string;
  description: string;
  learningObjectives: LearningObjective[];
  sections: {
    title: string;
    content: ContentBlock[];
  }[];
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface ReviewQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  feedback: {
    correct: string;
    incorrect: string;
  };
  explanation: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  moduleReference: string;
}

export interface EvaluationQuestion {
  id: string;
  question: string;
  type: 'likert' | 'text';
}

export interface CourseData {
  title: string;
  subtitle: string;
  description: string;
  cpeCredits: number;
  passingScore: number;
  totalAssessmentQuestions: number;
  learningObjectives: string[];
  modules: ModuleData[];
  reviewQuestions: Record<string, ReviewQuestion[]>;
  assessmentQuestions: AssessmentQuestion[];
  evaluationQuestions: EvaluationQuestion[];
}
