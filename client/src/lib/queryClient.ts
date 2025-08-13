import { QueryClient } from '@tanstack/react-query';

/** Create a single QueryClient for the app */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/* ----------------------- Safe localStorage helpers ----------------------- */

function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeLocalStorageSet(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  } catch {}
}

/* ------------------------------ Token utils ------------------------------ */

export function getToken(): string | null {
  const raw = safeLocalStorageGet('thronix_token') ?? safeLocalStorageGet('token');
  return raw && raw !== 'null' && raw !== 'undefined' ? raw : null;
}
export function setToken(token: string) {
  safeLocalStorageSet('thronix_token', token);
  safeLocalStorageSet('token', token); // backwards-compat for older code paths
}
export function clearToken() {
  safeLocalStorageSet('thronix_token', '');
  safeLocalStorageSet('token', '');
}

/* ---------------------------- Device ID utils ---------------------------- */
/** Stable per-installation ID used to enforce 1 account per device */
const DEVICE_KEY = 'thronix_device_id';
export function getDeviceId(): string | null {
  let id = safeLocalStorageGet(DEVICE_KEY);
  if (!id) {
    try {
      // Prefer crypto-quality randomness when available
      if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        const buf = new Uint8Array(16);
        window.crypto.getRandomValues(buf);
        id = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      }
      safeLocalStorageSet(DEVICE_KEY, id);
    } catch {
      // As a last resort, return null (server will ignore header)
      return null;
    }
  }
  return id;
}

/* ---------------------------- API base handling --------------------------- */

const API_BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_BASE_URL &&
    String((import.meta as any).env.VITE_API_BASE_URL).replace(/\/+$/, '')) || '';

function toUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

/* ---------------------------- Core apiRequest ----------------------------- */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const);

/**
 * Overloads:
 *  - apiRequest(path, method?, body?, init?)
 *  - apiRequest(method, path, body?, init?)
 */
export function apiRequest<T = any>(
  path: string,
  method?: HttpMethod,
  body?: unknown,
  init?: RequestInit
): Promise<T>;
export function apiRequest<T = any>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T>;
export async function apiRequest<T = any>(a: string, b?: any, c?: any, d?: any): Promise<T> {
  // Normalize arguments to (path, method, body, init)
  let path: string;
  let method: HttpMethod = 'GET';
  let body: unknown;
  let init: RequestInit | undefined;

  const isMethod = (s: unknown): s is HttpMethod =>
    typeof s === 'string' && HTTP_METHODS.has(s.toUpperCase() as HttpMethod);

  if (isMethod(a) && typeof b === 'string') {
    // Called as (method, path, body?, init?)
    method = a.toUpperCase() as HttpMethod;
    path = b;
    body = c;
    init = d;
  } else {
    // Called as (path, method?, body?, init?)
    path = a;
    if (isMethod(b)) {
      method = b.toUpperCase() as HttpMethod;
      body = c;
      init = d;
    } else {
      // (path, body?, init?) -> default GET unless body + no explicit method => use POST
      body = b;
      init = c;
      if (body !== undefined && method === 'GET') method = 'POST';
    }
  }

  // Compose headers carefully to avoid forcing preflight on simple GETs
  const headers = new Headers(init?.headers as any);
  const token = getToken();
  const deviceId = getDeviceId();

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (deviceId) headers.set('X-Device-Id', deviceId);
  headers.set('X-Requested-With', 'XMLHttpRequest');

  const res = await fetch(toUrl(path), {
    ...init,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const parse = () => {
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return text;
    }
  };

  if (!res.ok) {
    const payload = parse();
    const message =
      typeof payload === 'string'
        ? `${res.status} ${payload}`
        : payload?.error || payload?.message || res.statusText || `HTTP ${res.status}`;
    const err = new Error(message) as Error & { status?: number; data?: any };
    err.status = res.status;
    err.data = payload;
    throw err;
  }

  return (text ? JSON.parse(text) : {}) as T;
}

/* -------------------------- Convenience wrappers -------------------------- */

export const apiGet = <T = any>(path: string, init?: RequestInit) =>
  apiRequest<T>(path, 'GET', undefined, init);

export const apiPost = <T = any>(path: string, body?: unknown, init?: RequestInit) =>
  apiRequest<T>(path, 'POST', body, init);

export const apiPut = <T = any>(path: string, body?: unknown, init?: RequestInit) =>
  apiRequest<T>(path, 'PUT', body, init);

export const apiPatch = <T = any>(path: string, body?: unknown, init?: RequestInit) =>
  apiRequest<T>(path, 'PATCH', body, init);

export const apiDelete = <T = any>(path: string, body?: unknown, init?: RequestInit) =>
  apiRequest<T>(path, 'DELETE', body, init);
