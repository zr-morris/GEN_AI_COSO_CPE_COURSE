// Thin fetch wrapper for the backend API.
//
// Responsibilities:
//  - base URL (Vite env: VITE_API_BASE_URL, default http://localhost:8000/api)
//  - `credentials: 'include'` on every request so Django's session cookie
//    round-trips with the SPA (must be paired with CORS_ALLOW_CREDENTIALS
//    on the server)
//  - CSRF header for unsafe methods — Django issues the `csrftoken` cookie
//    at /auth/csrf/ and expects it echoed back as the `X-CSRFToken` header
//  - JSON parse with a typed throw on non-2xx
//
// Tests don't hit this file directly; the components that use it are rendered
// inside a CourseDataProvider which controls the fetch lifecycle.

const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8000/api';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Pull a cookie value by name. Returns null if the cookie is missing. */
function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  for (const chunk of document.cookie.split('; ')) {
    if (chunk.startsWith(prefix)) {
      return decodeURIComponent(chunk.slice(prefix.length));
    }
  }
  return null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/** Make a JSON request against the API. Returns `null` for 204 No Content. */
export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (UNSAFE_METHODS.has(method)) {
    const token = readCookie('csrftoken');
    if (token) {
      headers['X-CSRFToken'] = token;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload: unknown = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload,
      `API ${method} ${path} failed with ${response.status}`,
    );
  }

  return payload as T;
}

export { API_BASE_URL };
