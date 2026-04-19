import { describe, expect, it } from 'vitest';
import {
  canAccessSection,
  courseReducer,
  createInitialProgress,
  getProgressMilestones,
  type AssessmentResult,
  type CourseProgress,
} from './courseStore';

function makeResult(overrides: Partial<AssessmentResult> = {}): AssessmentResult {
  return {
    score: 7,
    totalQuestions: 10,
    percentage: 70,
    passed: true,
    answers: {},
    completedAt: '2026-04-17T00:00:00.000Z',
    timeSeconds: 1800,
    ...overrides,
  };
}

describe('courseReducer', () => {
  it('marks a module complete idempotently', () => {
    const initial = createInitialProgress();
    const after = courseReducer(initial, { type: 'COMPLETE_MODULE', moduleId: 'module1' });
    const again = courseReducer(after, { type: 'COMPLETE_MODULE', moduleId: 'module1' });
    expect(after.completedModules.has('module1')).toBe(true);
    expect(again.completedModules.size).toBe(1);
  });

  it('records a review answer under the right reviewId', () => {
    const next = courseReducer(createInitialProgress(), {
      type: 'SET_REVIEW_ANSWER',
      reviewId: 'review1',
      questionId: 'q1',
      answer: { questionId: 'q1', selectedOption: 'a', isCorrect: true, isLocked: true },
    });
    expect(next.reviewAnswers.review1.q1.isCorrect).toBe(true);
    expect(next.reviewAnswers.review1.q1.isLocked).toBe(true);
  });

  it('SUBMIT_EVALUATION unlocks the certificate', () => {
    const next = courseReducer(createInitialProgress(), {
      type: 'SUBMIT_EVALUATION',
      response: { responses: { e1: 5 }, submittedAt: '2026-04-17T00:00:00.000Z' },
    });
    expect(next.certificateUnlocked).toBe(true);
    expect(next.evaluationResponse?.responses.e1).toBe(5);
  });

  it('RESET_FOR_RETAKE clears assessment state but preserves module/review progress', () => {
    let s: CourseProgress = createInitialProgress();
    s = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module1' });
    s = courseReducer(s, { type: 'COMPLETE_REVIEW', reviewId: 'review1' });
    s = courseReducer(s, { type: 'SET_ASSESSMENT_ANSWER', questionId: 'q1', selectedOption: 'a' });
    s = courseReducer(s, { type: 'SUBMIT_ASSESSMENT', result: makeResult({ passed: false, percentage: 50 }) });

    const after = courseReducer(s, { type: 'RESET_FOR_RETAKE' });
    expect(after.assessmentResult).toBeNull();
    expect(after.assessmentAnswers).toEqual({});
    expect(after.completedModules.has('module1')).toBe(true);
    expect(after.completedReviews.has('review1')).toBe(true);
  });

  it('RESET wipes everything', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module1' });
    const after = courseReducer(s, { type: 'RESET' });
    expect(after.completedModules.size).toBe(0);
  });

  it('HYDRATE replaces the entire state (used by ProgressProvider after server fetch)', () => {
    const current = createInitialProgress();
    const replacement: CourseProgress = {
      ...createInitialProgress(),
      completedModules: new Set(['module1', 'module2']),
      certificateUnlocked: true,
    };
    const after = courseReducer(current, { type: 'HYDRATE', state: replacement });
    expect(after.completedModules.has('module2')).toBe(true);
    expect(after.certificateUnlocked).toBe(true);
  });
});

describe('canAccessSection', () => {
  it('always allows overview and module1', () => {
    const s = createInitialProgress();
    expect(canAccessSection(s, 'overview')).toBe(true);
    expect(canAccessSection(s, 'module1')).toBe(true);
  });

  it('locks review1 until module1 is complete', () => {
    const s = createInitialProgress();
    expect(canAccessSection(s, 'review1')).toBe(false);
    const after = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module1' });
    expect(canAccessSection(after, 'review1')).toBe(true);
  });

  it('locks module2 until review1 is complete', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module1' });
    expect(canAccessSection(s, 'module2')).toBe(false);
    s = courseReducer(s, { type: 'COMPLETE_REVIEW', reviewId: 'review1' });
    expect(canAccessSection(s, 'module2')).toBe(true);
  });

  it('locks assessment until review3 is complete', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'COMPLETE_REVIEW', reviewId: 'review3' });
    expect(canAccessSection(s, 'assessment')).toBe(true);
  });

  it('locks evaluation until assessment passed', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'SUBMIT_ASSESSMENT', result: makeResult({ passed: false }) });
    expect(canAccessSection(s, 'evaluation')).toBe(false);
    s = courseReducer(s, { type: 'SUBMIT_ASSESSMENT', result: makeResult({ passed: true }) });
    expect(canAccessSection(s, 'evaluation')).toBe(true);
  });

  it('locks certificate until evaluation submitted', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'SUBMIT_ASSESSMENT', result: makeResult() });
    expect(canAccessSection(s, 'certificate')).toBe(false);
    s = courseReducer(s, {
      type: 'SUBMIT_EVALUATION',
      response: { responses: {}, submittedAt: '2026-04-17T00:00:00.000Z' },
    });
    expect(canAccessSection(s, 'certificate')).toBe(true);
  });
});

describe('getProgressMilestones', () => {
  it('reports 0/8 on a fresh course', () => {
    expect(getProgressMilestones(createInitialProgress())).toEqual({ completed: 0, total: 8 });
  });

  it('counts each completed module/review/assessment/evaluation', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module1' });
    s = courseReducer(s, { type: 'COMPLETE_REVIEW', reviewId: 'review1' });
    s = courseReducer(s, { type: 'SUBMIT_ASSESSMENT', result: makeResult({ passed: true }) });
    s = courseReducer(s, {
      type: 'SUBMIT_EVALUATION',
      response: { responses: {}, submittedAt: '2026-04-17T00:00:00.000Z' },
    });
    expect(getProgressMilestones(s).completed).toBe(4);
  });

  it('does not count a failed assessment', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'SUBMIT_ASSESSMENT', result: makeResult({ passed: false, percentage: 40 }) });
    expect(getProgressMilestones(s).completed).toBe(0);
  });
});
