// Learner-progress API bindings.
//
// The backend stores progress as an opaque JSON blob keyed by (user, course_slug);
// the frontend owns the shape. We send/receive the serialized envelope from
// progressCodec.ts so localStorage and the server stay byte-identical.
//
// Endpoints (all require an authenticated session):
//   GET    /api/progress/<course_slug>/  → { courseSlug, payload, startedAt, updatedAt } | 404
//   PUT    /api/progress/<course_slug>/  body { payload: SerializedProgress } → upsert
//   DELETE /api/progress/<course_slug>/  → 204

import { ApiError, apiFetch } from './client';
import type { SerializedProgress } from '../store/progressCodec';

export interface CourseProgressRecord {
  courseSlug: string;
  payload: SerializedProgress;
  startedAt: string;
  updatedAt: string;
}

/**
 * Returns the server-side progress record for this course, or null when the
 * user hasn't started it yet (404). Other failure modes (network, 5xx) are
 * propagated so the caller can fall back to localStorage.
 */
export async function fetchProgress(
  courseSlug: string,
  signal?: AbortSignal,
): Promise<CourseProgressRecord | null> {
  try {
    return await apiFetch<CourseProgressRecord>(`/progress/${courseSlug}/`, { signal });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/** Upsert the progress blob. Returns the fresh record (with server timestamps). */
export async function saveProgress(
  courseSlug: string,
  payload: SerializedProgress,
): Promise<CourseProgressRecord> {
  return apiFetch<CourseProgressRecord>(`/progress/${courseSlug}/`, {
    method: 'PUT',
    body: { payload },
  });
}

export async function deleteProgress(courseSlug: string): Promise<void> {
  await apiFetch(`/progress/${courseSlug}/`, { method: 'DELETE' });
}
