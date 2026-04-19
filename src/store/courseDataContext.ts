// React context + consumer hook for the course data fetched from the backend.
//
// Kept in a .ts file (no JSX) so react-refresh's "only export components"
// rule doesn't complain about exporting both a Provider component and a hook
// from the same module. The Provider lives in courseDataStore.tsx; this file
// just holds the plumbing.

import { createContext, useContext } from 'react';
import type { CourseData } from '../data/courseContent';

export interface CourseDataContextValue {
  data: CourseData;
  refetch: () => void;
}

export const CourseDataContext = createContext<CourseDataContextValue | null>(
  null,
);

export function useCourseData(): CourseData {
  const ctx = useContext(CourseDataContext);
  if (!ctx) {
    throw new Error(
      'useCourseData must be called inside <CourseDataProvider>. ' +
        'Make sure the provider wraps your route tree.',
    );
  }
  return ctx.data;
}

/** Imperative refetch handle — useful for error-state retry buttons. */
export function useCourseDataRefetch(): () => void {
  const ctx = useContext(CourseDataContext);
  if (!ctx) {
    throw new Error(
      'useCourseDataRefetch must be called inside <CourseDataProvider>.',
    );
  }
  return ctx.refetch;
}
