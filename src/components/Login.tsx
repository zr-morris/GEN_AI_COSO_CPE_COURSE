// Login screen shown by AuthProvider whenever there's no active session.
//
// Two sign-in paths:
//   1. Username / password form → POST /api/auth/login/
//      (works out-of-the-box for local dev; the `admin / admin` seed user
//      created by `uv run python manage.py ensure_dev_admin` is the intended
//      fallback.)
//   2. "Sign in with Microsoft" button → full-page nav to the backend's
//      /api/auth/microsoft/login/, which redirects to Entra ID and back.
//      The button is hidden automatically if the admin hasn't configured
//      Azure credentials — see backend/README.md for setup.

import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import {
  type AuthUser,
  beginMicrosoftLogin,
  fetchMicrosoftConfig,
  login,
  type MicrosoftAuthConfig,
} from '../api/auth';

interface LoginProps {
  onAuthenticated: (user: AuthUser) => void;
  /** If the user just came back from a failed SSO callback, surface the reason. */
  ssoError?: string;
}

function describeSsoError(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case 'microsoft_denied':
      return 'Microsoft sign-in was cancelled or denied. Please try again.';
    case 'state_mismatch':
    case 'missing_code':
      return 'The sign-in request expired or was tampered with. Please try again.';
    case 'token_exchange_failed':
      return 'We could not complete the handshake with Microsoft. Please try again.';
    case 'graph_failed':
      return 'We signed in but could not read your profile from Microsoft. Please try again.';
    case 'not_configured':
      return 'Microsoft sign-in is not configured on this server.';
    default:
      return `Sign-in failed (${code}). Please try again.`;
  }
}

export function Login({ onAuthenticated, ssoError }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(describeSsoError(ssoError));
  const [msConfig, setMsConfig] = useState<MicrosoftAuthConfig | null>(null);

  useEffect(() => {
    fetchMicrosoftConfig()
      .then(setMsConfig)
      .catch(() => setMsConfig({ enabled: false }));
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(username, password);
      onAuthenticated(user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid username or password.');
      } else if (err instanceof ApiError && err.status === 403) {
        // CSRF failure — usually means the csrf cookie wasn't set. Bootstrap
        // has fetched /csrf/ by the time we get here, so this is rare.
        setError('Session expired. Please reload the page and try again.');
      } else {
        setError(
          err instanceof Error ? err.message : 'Sign-in failed. Please try again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-kpmg-blue to-kpmg-purple px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-kpmg-blue via-kpmg-light-blue to-kpmg-purple"></div>

        <div className="p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <i
              className="fas fa-graduation-cap text-3xl text-kpmg-blue"
              aria-hidden="true"
            ></i>
            <div>
              <div className="text-2xl font-bold text-kpmg-blue">KPMG</div>
              <div className="text-xs font-semibold text-kpmg-gray uppercase tracking-widest">
                CPE Self-Study
              </div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-kpmg-gray mb-6">
            Sign in to continue to your course.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2"
            >
              <i
                className="fas fa-exclamation-circle text-red-500 mt-0.5 text-sm"
                aria-hidden="true"
              ></i>
              <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label
              htmlFor="login-username"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full mb-4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kpmg-blue/30 focus:border-kpmg-blue"
            />

            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mb-5 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kpmg-blue/30 focus:border-kpmg-blue"
            />

            <button
              type="submit"
              disabled={submitting || !username || !password}
              className="w-full inline-flex items-center justify-center gap-2 bg-kpmg-blue hover:bg-kpmg-blue/90 disabled:bg-kpmg-blue/40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue focus-visible:ring-offset-2"
            >
              {submitting ? (
                <>
                  <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          {msConfig?.enabled && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                  or
                </span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <button
                type="button"
                onClick={beginMicrosoftLogin}
                className="w-full inline-flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium px-4 py-2.5 rounded-lg border border-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue focus-visible:ring-offset-2"
              >
                {/* Microsoft logo (4-square mark, inline SVG so no extra asset). */}
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 23 23"
                  className="flex-shrink-0"
                >
                  <rect width="10" height="10" x="1" y="1" fill="#f35325" />
                  <rect width="10" height="10" x="12" y="1" fill="#81bc06" />
                  <rect width="10" height="10" x="1" y="12" fill="#05a6f0" />
                  <rect width="10" height="10" x="12" y="12" fill="#ffba08" />
                </svg>
                <span>Sign in with Microsoft</span>
              </button>
            </>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
            For local development, the default credentials are{' '}
            <code className="bg-gray-100 px-1 py-0.5 rounded">admin</code> /{' '}
            <code className="bg-gray-100 px-1 py-0.5 rounded">admin</code>.
            <br />
            Change them before exposing this service.
          </p>
        </div>
      </div>
    </div>
  );
}
