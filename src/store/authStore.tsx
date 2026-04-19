// Auth provider: bootstraps the session at app load and gates the rest of
// the tree on being signed in.
//
// Lifecycle on mount:
//  1. Hit GET /api/auth/csrf/ so the browser has a `csrftoken` cookie ready
//     for any subsequent POST (login, logout, progress PUT, …).
//  2. Hit GET /api/auth/me/ to see if there's already a valid session (the
//     user may have just come back from the Microsoft SSO redirect, or may
//     be resuming a previous session).
//  3. If authenticated → render <AuthContext.Provider>{children}</…>.
//     Otherwise → render <Login />, which calls `onAuthenticated` after a
//     successful password or SSO round-trip.
//
// A small query-string handler also reads `?auth=ok` / `?auth=error&reason=…`
// that the Microsoft callback appends, so we can (a) re-fetch /me/ after SSO
// and (b) surface a toast/error if the callback failed.

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Login } from '../components/Login';
import {
  fetchCsrf,
  fetchMe,
  logout as logoutApi,
  type AuthUser,
} from '../api/auth';
import { AuthContext } from './authContext';
import { clearPersistedProgress } from './persistence';

type BootState =
  | { status: 'loading' }
  | { status: 'anonymous'; ssoError?: string }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'error'; error: Error };

function readSsoCallbackQuery(): { ok: boolean; error?: string } | null {
  // Vite + HashRouter means the app hash lives in location.hash; but the
  // Microsoft callback bounces us to just `FRONTEND_URL?auth=ok`, so the
  // flag is in the *query* portion, not the hash.
  const params = new URLSearchParams(window.location.search);
  const authFlag = params.get('auth');
  if (!authFlag) return null;
  return {
    ok: authFlag === 'ok',
    error: authFlag === 'error' ? (params.get('reason') ?? 'unknown') : undefined,
  };
}

/** Strip the ?auth=... query so a page refresh doesn't loop through the SSO flow. */
function clearSsoCallbackQuery(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('auth');
  url.searchParams.delete('reason');
  window.history.replaceState({}, '', url.toString());
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<BootState>({ status: 'loading' });

  const bootstrap = useCallback(async () => {
    setState({ status: 'loading' });

    // Don't let a CSRF-cookie failure block the rest of the flow — worst case
    // login still works, it just won't carry the token until the next reload.
    try {
      await fetchCsrf();
    } catch {
      // fall through — fetchMe will also surface an error if the API is down
    }

    const ssoCallback = readSsoCallbackQuery();
    if (ssoCallback) {
      clearSsoCallbackQuery();
    }

    try {
      const user = await fetchMe();
      if (user) {
        setState({ status: 'authenticated', user });
      } else {
        setState({
          status: 'anonymous',
          ssoError: ssoCallback?.error,
        });
      }
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const handleAuthenticated = useCallback((user: AuthUser) => {
    setState({ status: 'authenticated', user });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      // Wipe the cached progress so the next learner on this device doesn't
      // inherit the previous user's completion state. Their own server-side
      // progress will re-hydrate on the next login.
      clearPersistedProgress();
      setState({ status: 'anonymous' });
    }
  }, []);

  if (state.status === 'loading') {
    return <AuthBootstrapSpinner />;
  }

  if (state.status === 'error') {
    return <AuthBootstrapError error={state.error} onRetry={bootstrap} />;
  }

  if (state.status === 'anonymous') {
    return (
      <Login
        onAuthenticated={handleAuthenticated}
        ssoError={state.ssoError}
      />
    );
  }

  return (
    <AuthContext.Provider value={{ user: state.user, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Tiny helper views — kept inline so the provider is self-contained.
// ---------------------------------------------------------------------------

function AuthBootstrapSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex items-center justify-center bg-kpmg-light-gray"
    >
      <div className="flex items-center gap-3 text-kpmg-gray">
        <i className="fas fa-circle-notch fa-spin text-2xl" aria-hidden="true"></i>
        <span className="text-sm">Checking your session…</span>
      </div>
    </div>
  );
}

interface AuthBootstrapErrorProps {
  error: Error;
  onRetry: () => void;
}

function AuthBootstrapError({ error, onRetry }: AuthBootstrapErrorProps) {
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
            Couldn't reach the server
          </h1>
        </div>
        <p className="text-sm text-gray-700 mb-2">
          We weren't able to check whether you're signed in. Is the backend
          running?
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
