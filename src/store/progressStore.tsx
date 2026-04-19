// Learner-progress store with server sync.
//
// Owns the `useReducer` that used to live in App.tsx. The added value over
// the plain reducer is a two-way bridge:
//
//   Boot: render immediately with whatever is in localStorage (offline cache)
//         → in parallel, GET /api/progress/<slug>/ to hydrate from the server
//         → if the server has a record, dispatch HYDRATE (server wins)
//
//   Each state change (after hydration):
//         → write to localStorage IMMEDIATELY (never lose progress to a dead tab)
//         → debounce a PUT /api/progress/<slug>/ by 600 ms so rapid dispatches
//           (typing into an eval textarea, say) collapse into one network call
//         → flush the pending PUT on visibility change / unmount so the last
//           write isn't lost when the tab backgrounds or closes
//
// Open questions intentionally punted:
//   - Multi-course: the slug is pinned to the demo course (single-course app).
//   - Conflict resolution: last-write-wins. For a CPE course where state is
//     mostly monotonic (you can only *gain* completions), the worst case is
//     losing a single click on a flaky network — acceptable for now.
//   - Retries: a failed PUT is logged in dev and forgotten. The next dispatch
//     triggers another PUT; on retry we'll have the latest state anyway.

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import {
  CourseContext,
  courseReducer,
  createInitialProgress,
  type CourseProgress,
} from './courseStore';
import { loadProgress, persistProgress } from './persistence';
import { decodeProgress, encodeProgress } from './progressCodec';
import { fetchProgress, saveProgress } from '../api/progress';
import { DEMO_COURSE_SLUG } from '../api/courses';
import { ApiError } from '../api/client';

const SAVE_DEBOUNCE_MS = 600;

interface ProgressProviderProps {
  children: ReactNode;
  /** Course slug to sync against. Defaults to the demo course. */
  courseSlug?: string;
}

export function ProgressProvider({
  children,
  courseSlug = DEMO_COURSE_SLUG,
}: ProgressProviderProps) {
  // Optimistic: start with localStorage (if any) so the app renders fast.
  const [state, dispatch] = useReducer(
    courseReducer,
    undefined,
    () => loadProgress() ?? createInitialProgress(),
  );

  // We don't want the save effect to fire before the server hydration
  // completes — otherwise a stale localStorage snapshot could clobber a good
  // server record. This ref flips to true after fetchProgress settles
  // (success, 404, or failure).
  const hydratedRef = useRef(false);
  // Debounce handle for the pending save.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The most recent state that should be PUT. Read by the flush helpers so
  // "save on hide" doesn't go through the debounce.
  const pendingStateRef = useRef<CourseProgress | null>(null);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  // -- 1. Hydrate from the server on mount --------------------------------
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const record = await fetchProgress(courseSlug, controller.signal);
        if (cancelled) return;
        if (record) {
          const decoded = decodeProgress(record.payload);
          if (decoded) {
            dispatch({ type: 'HYDRATE', state: decoded });
          }
        }
      } catch (err) {
        // Network / 5xx / 401. Fall back to whatever the optimistic load gave
        // us. A 401 here is benign — the AuthProvider will also notice and
        // push the user back to the login screen.
        if (import.meta.env.DEV) {
          console.warn('[progress] server hydration failed', err);
        }
      } finally {
        if (!cancelled) {
          hydratedRef.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [courseSlug]);

  // -- 2a. Immediate localStorage write on every dispatch -----------------
  useEffect(() => {
    persistProgress(state);
  }, [state]);

  // -- 2b. Debounced server save ------------------------------------------
  const flush = useCallback(async () => {
    const snapshot = pendingStateRef.current;
    if (!snapshot) return;
    pendingStateRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    try {
      await saveProgress(courseSlug, encodeProgress(snapshot));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        // AuthProvider will re-check on the next /me/ and bounce to login.
        return;
      }
      if (import.meta.env.DEV) {
        console.warn('[progress] save failed', err);
      }
    }
  }, [courseSlug]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    pendingStateRef.current = state;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void flush();
    }, SAVE_DEBOUNCE_MS);

    return () => {
      // Tear-down: don't auto-flush on every re-render. We clean up in the
      // unmount effect below.
    };
  }, [state, flush]);

  // -- 2c. Flush on tab hide / unmount ------------------------------------
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flush();
      }
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);

    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      // Final flush on unmount — fire-and-forget; the promise lives past the
      // React tree.
      void flush();
    };
  }, [flush]);

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}
