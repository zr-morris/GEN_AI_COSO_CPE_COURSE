// Encode/decode helpers for CourseProgress.
//
// The exact same shape is used for two sinks:
//   - localStorage (via persistence.ts — offline cache)
//   - the server `payload` JSON blob (via api/progress.ts — cross-device)
//
// Keeping the codec in one place means we can never have a subtle schema drift
// between the two stores. The versioned envelope lets us either reject old
// data (return null) or migrate it on the way in.

import type { CourseProgress } from './courseStore';

/** Bump when the serialized shape changes. A mismatch makes decode return null. */
export const PROGRESS_VERSION = 1;

export interface SerializedProgress {
  version: number;
  data: {
    startedAt: string;
    completedModules: string[];
    completedReviews: string[];
    reviewAnswers: CourseProgress['reviewAnswers'];
    assessmentResult: CourseProgress['assessmentResult'];
    assessmentAnswers: CourseProgress['assessmentAnswers'];
    evaluationResponse: CourseProgress['evaluationResponse'];
    certificateUnlocked: boolean;
  };
}

/** Convert in-memory state (with Sets) to a JSON-safe envelope. */
export function encodeProgress(state: CourseProgress): SerializedProgress {
  return {
    version: PROGRESS_VERSION,
    data: {
      startedAt: state.startedAt,
      completedModules: Array.from(state.completedModules),
      completedReviews: Array.from(state.completedReviews),
      reviewAnswers: state.reviewAnswers,
      assessmentResult: state.assessmentResult,
      assessmentAnswers: state.assessmentAnswers,
      evaluationResponse: state.evaluationResponse,
      certificateUnlocked: state.certificateUnlocked,
    },
  };
}

/**
 * Best-effort decode. Returns null on shape mismatch or version mismatch so
 * the caller can fall back to a fresh state rather than crashing.
 */
export function decodeProgress(raw: unknown): CourseProgress | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const envelope = raw as Partial<SerializedProgress>;
  if (envelope.version !== PROGRESS_VERSION) return null;
  if (typeof envelope.data !== 'object' || envelope.data === null) return null;

  const d = envelope.data as SerializedProgress['data'];

  // A couple of cheap shape guards. If any required field is missing the
  // payload is corrupt enough to bail; a fresh state is safer than a partial
  // one.
  if (
    typeof d.startedAt !== 'string' ||
    !Array.isArray(d.completedModules) ||
    !Array.isArray(d.completedReviews) ||
    typeof d.reviewAnswers !== 'object' ||
    typeof d.assessmentAnswers !== 'object' ||
    typeof d.certificateUnlocked !== 'boolean'
  ) {
    return null;
  }

  return {
    startedAt: d.startedAt,
    completedModules: new Set(d.completedModules),
    completedReviews: new Set(d.completedReviews),
    reviewAnswers: d.reviewAnswers,
    assessmentResult: d.assessmentResult ?? null,
    assessmentAnswers: d.assessmentAnswers,
    evaluationResponse: d.evaluationResponse ?? null,
    certificateUnlocked: d.certificateUnlocked,
  };
}
