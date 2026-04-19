// Fetches the course content from the backend once and makes it available to
// the whole tree via React context.
//
// The previous architecture imported a hard-coded `courseData` constant; moving
// to a context lets us swap the source without plumbing props through every
// screen. The provider renders a spinner while the initial fetch is in flight
// and surfaces a retryable error UI on failure.
//
// The context + hook live in courseDataContext.ts so this file only exports
// components (keeps react-refresh happy).

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { fetchCourse } from '../api/courses';
import type { CourseData } from '../data/courseContent';
import { CourseDataContext } from './courseDataContext';

type FetchState =
  | { status: 'loading' }
  | { status: 'ready'; data: CourseData }
  | { status: 'error'; error: Error };

interface CourseDataProviderProps {
  children: ReactNode;
  /** Optional override — useful for tests. When provided, no network call is made. */
  initialData?: CourseData;
  /** Slug to fetch; defaults to the demo course. */
  slug?: string;
}

export function CourseDataProvider({
  children,
  initialData,
  slug,
}: CourseDataProviderProps) {
  const [state, setState] = useState<FetchState>(() =>
    initialData ? { status: 'ready', data: initialData } : { status: 'loading' },
  );
  const [attempt, setAttempt] = useState(0);

  const refetch = useCallback(() => {
    setAttempt((n) => n + 1);
    setState({ status: 'loading' });
  }, []);

  useEffect(() => {
    if (initialData) return;

    const controller = new AbortController();
    let cancelled = false;

    fetchCourse(slug, controller.signal)
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'ready', data });
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ status: 'error', error });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [initialData, slug, attempt]);

  if (state.status === 'loading') {
    return <CourseDataLoading />;
  }

  if (state.status === 'error') {
    return <CourseDataError error={state.error} onRetry={refetch} />;
  }

  return (
    <CourseDataContext.Provider value={{ data: state.data, refetch }}>
      {children}
    </CourseDataContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Loading + error views — kept inline so the provider is self-contained.
// ---------------------------------------------------------------------------

function CourseDataLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex items-center justify-center bg-kpmg-light-gray"
    >
      <div className="flex items-center gap-3 text-kpmg-gray">
        <i className="fas fa-circle-notch fa-spin text-2xl" aria-hidden="true"></i>
        <span className="text-sm">Loading course…</span>
      </div>
    </div>
  );
}

interface CourseDataErrorProps {
  error: Error;
  onRetry: () => void;
}

function CourseDataError({ error, onRetry }: CourseDataErrorProps) {
  return (
    <div
      role="alert"
      className="min-h-screen flex items-center justify-center bg-kpmg-light-gray px-6"
    >
      <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <i
            className="fas fa-exclamation-triangle text-red-500 text-xl"
            aria-hidden="true"
          ></i>
          <h1 className="text-lg font-bold text-gray-900">
            Couldn't load the course
          </h1>
        </div>
        <p className="text-sm text-gray-700 mb-2">
          We weren't able to reach the course API. Check that the backend is
          running at{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
            {import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'}
          </code>
          .
        </p>
        <p className="text-xs text-kpmg-gray mb-4 font-mono break-words">
          {error.message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-kpmg-blue hover:bg-kpmg-blue/90 text-white font-semibold px-4 py-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue focus-visible:ring-offset-2"
        >
          <i className="fas fa-rotate-right" aria-hidden="true"></i>
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
}
