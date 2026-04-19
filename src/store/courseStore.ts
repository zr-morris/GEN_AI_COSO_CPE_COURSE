import { createContext, useContext } from 'react';

export type SectionId =
  | 'overview'
  | 'module1' | 'module2' | 'module3'
  | 'review1' | 'review2' | 'review3'
  | 'assessment'
  | 'evaluation'
  | 'certificate';

export interface ReviewAnswer {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  isLocked: boolean;
}

export interface AssessmentAnswer {
  questionId: string;
  selectedOption: string;
}

export interface AssessmentResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, AssessmentAnswer>;
  completedAt: string;
  timeSeconds: number;
}

export interface EvaluationResponse {
  responses: Record<string, number | string>;
  submittedAt: string;
}

export interface CourseProgress {
  startedAt: string;
  completedModules: Set<string>;
  completedReviews: Set<string>;
  reviewAnswers: Record<string, Record<string, ReviewAnswer>>;
  assessmentResult: AssessmentResult | null;
  assessmentAnswers: Record<string, string>;
  evaluationResponse: EvaluationResponse | null;
  certificateUnlocked: boolean;
}

export function createInitialProgress(): CourseProgress {
  return {
    startedAt: new Date().toISOString(),
    completedModules: new Set(),
    completedReviews: new Set(),
    reviewAnswers: {},
    assessmentResult: null,
    assessmentAnswers: {},
    evaluationResponse: null,
    certificateUnlocked: false,
  };
}

export type CourseAction =
  | { type: 'COMPLETE_MODULE'; moduleId: string }
  | { type: 'COMPLETE_REVIEW'; reviewId: string }
  | { type: 'SET_REVIEW_ANSWER'; reviewId: string; questionId: string; answer: ReviewAnswer }
  | { type: 'SET_ASSESSMENT_ANSWER'; questionId: string; selectedOption: string }
  | { type: 'SUBMIT_ASSESSMENT'; result: AssessmentResult }
  | { type: 'SUBMIT_EVALUATION'; response: EvaluationResponse }
  | { type: 'UNLOCK_CERTIFICATE' }
  | { type: 'RESET_FOR_RETAKE' }
  | { type: 'RESET' }
  // Wholesale state replacement — dispatched by ProgressProvider after the
  // server hydration completes. Used instead of re-initializing so the
  // in-flight React tree doesn't have to unmount.
  | { type: 'HYDRATE'; state: CourseProgress };

export function courseReducer(state: CourseProgress, action: CourseAction): CourseProgress {
  switch (action.type) {
    case 'COMPLETE_MODULE': {
      const newModules = new Set(state.completedModules);
      newModules.add(action.moduleId);
      return { ...state, completedModules: newModules };
    }

    case 'COMPLETE_REVIEW': {
      const newReviews = new Set(state.completedReviews);
      newReviews.add(action.reviewId);
      return { ...state, completedReviews: newReviews };
    }

    case 'SET_REVIEW_ANSWER': {
      const reviewAnswers = { ...state.reviewAnswers };
      reviewAnswers[action.reviewId] = {
        ...(reviewAnswers[action.reviewId] ?? {}),
        [action.questionId]: action.answer,
      };
      return { ...state, reviewAnswers };
    }

    case 'SET_ASSESSMENT_ANSWER':
      return {
        ...state,
        assessmentAnswers: {
          ...state.assessmentAnswers,
          [action.questionId]: action.selectedOption,
        },
      };

    case 'SUBMIT_ASSESSMENT':
      return { ...state, assessmentResult: action.result };

    case 'SUBMIT_EVALUATION':
      return {
        ...state,
        evaluationResponse: action.response,
        certificateUnlocked: true,
      };

    case 'UNLOCK_CERTIFICATE':
      return { ...state, certificateUnlocked: true };

    case 'RESET_FOR_RETAKE':
      // Clear assessment results & answers but preserve module/review progress
      return {
        ...state,
        assessmentResult: null,
        assessmentAnswers: {},
      };

    case 'RESET':
      return createInitialProgress();

    case 'HYDRATE':
      return action.state;

    default:
      return state;
  }
}

export function getProgressMilestones(state: CourseProgress): { completed: number; total: number } {
  let completed = 0;
  const total = 8; // 3 modules + 3 reviews + assessment + evaluation

  if (state.completedModules.has('module1')) completed++;
  if (state.completedModules.has('module2')) completed++;
  if (state.completedModules.has('module3')) completed++;

  if (state.completedReviews.has('review1')) completed++;
  if (state.completedReviews.has('review2')) completed++;
  if (state.completedReviews.has('review3')) completed++;

  if (state.assessmentResult?.passed) completed++;
  if (state.evaluationResponse) completed++;

  return { completed, total };
}

export function canAccessSection(state: CourseProgress, section: SectionId): boolean {
  switch (section) {
    case 'overview':
    case 'module1':
      return true;
    case 'review1':
      return state.completedModules.has('module1');
    case 'module2':
      return state.completedReviews.has('review1');
    case 'review2':
      return state.completedModules.has('module2');
    case 'module3':
      return state.completedReviews.has('review2');
    case 'review3':
      return state.completedModules.has('module3');
    case 'assessment':
      return state.completedReviews.has('review3');
    case 'evaluation':
      return state.assessmentResult?.passed === true;
    case 'certificate':
      return state.certificateUnlocked;
    default:
      return false;
  }
}

/** Path mapping — kept here so routes and store stay in sync. */
export const sectionPaths: Record<SectionId, string> = {
  overview: '/',
  module1: '/module/1',
  module2: '/module/2',
  module3: '/module/3',
  review1: '/review/1',
  review2: '/review/2',
  review3: '/review/3',
  assessment: '/assessment',
  evaluation: '/evaluation',
  certificate: '/certificate',
};

export interface CourseContextType {
  state: CourseProgress;
  dispatch: React.Dispatch<CourseAction>;
}

export const CourseContext = createContext<CourseContextType | null>(null);

export function useCourse(): CourseContextType {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}
