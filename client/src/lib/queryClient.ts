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
  // accept either key your app might be using
  const raw =
    safeLocalStorageGet('thronix_token') ?? safeLocalStorageGet('token');
  return raw && raw !== 'null' && raw !== 'undefined' ? raw : null;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function apiRequest<T = any>(
  url: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });

  // Try to parse JSON if possible, but keep the error informative
  const text = await res.text();
  const parseJson = () => {
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return text;
    }
  };

  if (!res.ok) {
    const payload = parseJson();
    // Surface a useful error; React Query will catch it
    throw new Error(
      typeof payload === 'string'
        ? `${res.status} ${payload}`
        : `${res.status} ${payload?.error ?? res.statusText}`
    );
  }

  return (text ? JSON.parse(text) : {}) as T;
}

