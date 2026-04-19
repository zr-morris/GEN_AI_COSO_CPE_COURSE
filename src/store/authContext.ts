// React context + consumer hooks for the authenticated-user state.
//
// Context lives in a .ts file so react-refresh doesn't complain about
// exporting both a Provider component (JSX) and a hook (not JSX) from the
// same module — the Provider lives alongside it in authStore.tsx.

import { createContext, useContext } from 'react';
import type { AuthUser } from '../api/auth';

export interface AuthContextValue {
  user: AuthUser;
  /** Trigger a session logout + reset to the login screen. */
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuth must be called inside <AuthProvider>. ' +
        'Make sure the provider wraps your route tree.',
    );
  }
  return ctx;
}
