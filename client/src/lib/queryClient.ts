import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  const raw =
    safeLocalStorageGet('thronix_token') ?? safeLocalStorageGet('token');
  return raw && raw !== 'null' && raw !== 'undefined' ? raw : null;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

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
export async function apiRequest<T = any>(
  a: string,
  b?: any,
  c?: any,
  d?: any
): Promise<T> {
  // Normalize arguments to (path, method, body, init)
  let path: string;
  let method: HttpMethod = 'GET';
  let body: unknown;
  let init: RequestInit | undefined;

  const isMethod = (s: unknown): s is HttpMethod =>
    typeof s === 'string' && HTTP_METHODS.has(s.toUpperCase());

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
      // (path, body?, init?) with default GET
      body = b;
      init = c;
    }
  }

  const headers = new Headers({ 'Content-Type': 'application/json' });
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });

  const text = await res.text();
  const tryJson = () => {
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return text;
    }
  };

  if (!res.ok) {
    const payload = tryJson();
    throw new Error(
      typeof payload === 'string'
        ? `${res.status} ${payload}`
        : `${res.status} ${payload?.error ?? res.statusText}`
    );
  }

  return (text ? JSON.parse(text) : {}) as T;
}
