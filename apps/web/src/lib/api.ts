import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (session) headers.set('Authorization', `Bearer ${session.access_token}`);
  const response = await fetch(`/api${path}`, { ...init, headers, credentials: 'same-origin' });
  const data = await response.json().catch(() => {
    throw new ApiError(
      'The API returned an unexpected response. Check the server connection and API routing.',
      502,
    );
  });
  if (!response.ok)
    throw new ApiError(data.message ?? 'Unable to complete this request.', response.status);
  return data as T;
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
