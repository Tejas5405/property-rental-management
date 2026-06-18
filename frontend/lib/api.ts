import { supabase } from './supabaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Returns the current Supabase access token, or null if not signed in. */
export async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Authenticated fetch wrapper for the Express backend.
 * - Prepends NEXT_PUBLIC_API_URL.
 * - Attaches `Authorization: Bearer <token>`.
 * - Throws Error(message) using the API's `{ error }` body on non-2xx.
 */
export async function api<T>(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) ||
      `Request failed with status ${res.status}`;
    throw new Error(message as string);
  }
  return data as T;
}
