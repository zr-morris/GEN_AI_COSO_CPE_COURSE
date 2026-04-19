// Auth API bindings.
//
// Everything here lines up with apps/accounts/api.py + microsoft_auth.py on
// the backend. The React AuthProvider (src/store/authStore.tsx) is the only
// consumer today — components call `useAuth()` and get a typed `user` object
// plus `login` / `logout` handles.

import { ApiError, API_BASE_URL, apiFetch } from './client';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isStaff: boolean;
}

export interface MicrosoftAuthConfig {
  enabled: boolean;
  /** Absolute URL the browser should navigate to in order to start the SSO flow. */
  login_url?: string;
}

/** Force-issue the `csrftoken` cookie so the next POST can include it. */
export async function fetchCsrf(): Promise<void> {
  await apiFetch('/auth/csrf/');
}

/** Returns the current user, or `null` if the session is anonymous. */
export async function fetchMe(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>('/auth/me/');
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return null;
    }
    throw err;
  }
}

/** Username + password login. Returns the new user. Throws ApiError on 401. */
export async function login(
  username: string,
  password: string,
): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/login/', {
    method: 'POST',
    body: { username, password },
  });
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout/', { method: 'POST' });
}

/**
 * Check whether the backend has Microsoft SSO configured. Returns `{ enabled: false }`
 * when the admin hasn't filled in the Azure client id/secret/tenant. The SPA
 * uses this to show/hide the "Sign in with Microsoft" button.
 */
export async function fetchMicrosoftConfig(): Promise<MicrosoftAuthConfig> {
  return apiFetch<MicrosoftAuthConfig>('/auth/microsoft/config/');
}

/**
 * Kick off Microsoft SSO by doing a full-page navigation to the backend's
 * login endpoint. The backend redirects to Microsoft, which redirects back
 * to `/api/auth/microsoft/callback/`, which finally bounces to the SPA root
 * with `?auth=ok` (or `?auth=error&reason=...`).
 *
 * Doing a full-page navigation (rather than fetch + popup) keeps session
 * cookies and CSRF simple: everything happens within the first-party domain
 * of the backend.
 */
export function beginMicrosoftLogin(): void {
  window.location.href = `${API_BASE_URL}/auth/microsoft/login/`;
}
