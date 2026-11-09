import { useCallback, useEffect, useRef, useState } from 'react';
import { api, message, ApiError } from './api';
import { useAuth } from './auth';
export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const { refresh } = useAuth();
  const pending = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError('');
    try {
      const next = await api<T>(path, { signal: controller.signal });
      if (!controller.signal.aborted) setData(next);
    } catch (e) {
      if (controller.signal.aborted) return;
      if (e instanceof ApiError && e.status === 401) await refresh();
      else setError(message(e));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [path, refresh]);
  useEffect(() => {
    setData(null);
    void reload();
    return () => pending.current?.abort();
  }, [reload]);
  return { data, error, loading, reload };
}
export function invitationToken(value: string) {
  const trimmed = value.trim();
  if (/^[a-f0-9]{64}$/.test(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    const token = new URLSearchParams(parsed.hash.slice(1)).get('token');
    if (token && /^[a-f0-9]{64}$/.test(token)) return token;
  } catch {
    /* Treat invalid URLs as invalid codes. */
  }
  throw new Error('Paste a valid invitation link or its 64-character code.');
}
export const PENDING_INVITE = 'stakeup.pending-invitation';
export function afterSignIn() {
  return sessionStorage.getItem(PENDING_INVITE) ? '/join' : '/app';
}
export function tomorrow(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((p) => p.type === type)!.value;
  const date = new Date(`${value('year')}-${value('month')}-${value('day')}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export const credits = (minor: number) => `${(minor / 100).toFixed(2)} VC`;
