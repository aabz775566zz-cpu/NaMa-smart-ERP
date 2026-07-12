import type { JwtPayload } from '@erp-smart/types';

import { useAuthStore } from '../store/auth-store';
import { API_BASE_URL } from './config';
import { ApiError, extractErrorMessage } from './errors';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

interface RefreshResponse {
  accessToken: string;
  user: JwtPayload;
}

// Endpoints that must never trigger the 401-refresh-retry cycle themselves:
// refresh failing here means the session is genuinely over (retrying would
// recurse); login/register returning 401/400 is just "wrong credentials",
// not an expired-session case.
const NO_REFRESH_RETRY_PATHS = new Set(['/auth/refresh', '/auth/login', '/auth/register']);

let refreshPromise: Promise<boolean> | null = null;

/** Concurrent 401s (e.g. several queries firing at once right as the access
 * token expires) must share ONE refresh attempt, not each fire their own —
 * the backend's refresh-token rotation treats a second concurrent use of an
 * already-rotated-out refresh cookie as token reuse and revokes every
 * session for that user. Deduping here is what stops an ordinary
 * multi-query page load from accidentally triggering that security
 * response and logging the user out unexpectedly. */
async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;

      const data = (await res.json()) as RefreshResponse;
      useAuthStore.getState().setSession(data.accessToken, data.user);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function parseErrorBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    // The refresh cookie is scoped server-side to path /auth, so it's only
    // ever actually attached on /auth/* calls regardless of this option —
    // `include` is what allows the browser to send/receive cookies
    // cross-origin at all (the frontend and API are different origins even
    // in local dev).
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !isRetry && !NO_REFRESH_RETRY_PATHS.has(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    useAuthStore.getState().clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Session expired.');
  }

  if (!res.ok) {
    const body = (await parseErrorBody(res)) as Parameters<typeof extractErrorMessage>[0];
    throw new ApiError(res.status, extractErrorMessage(body, `Request failed (${res.status}).`), body);
  }

  // Some endpoints (e.g. DELETE /products/:id, POST /auth/logout) return a
  // 200/201 with a genuinely empty body rather than 204 — res.json() throws
  // a SyntaxError on empty input, so check for actual content first instead
  // of only special-casing 204.
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
