import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Profile, RuntimeConfig, ProfileInput, Appearance } from '@stakeup/contracts';
import { api, ApiError, supabase, message } from './api';
interface AuthState {
  profile: Profile | null;
  mode: RuntimeConfig['authMode'] | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
  update: (input: ProfileInput) => Promise<void>;
  updateAppearance: (appearance: Appearance) => Promise<void>;
  updateLanguage: (language: 'en' | 'ru') => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<AuthState['mode']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const current = await api<Profile>('/me');
      setProfile(current);
      setError('');
      return current;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setProfile(null);
        return null;
      } else throw error;
    }
  }, []);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const config = await api<RuntimeConfig>('/config');
        if ((config.authMode === 'supabase') !== !!supabase)
          throw new Error(
            'Frontend and API authentication configuration differ. Check the Supabase environment variables.',
          );
        if (live) setMode(config.authMode);
        await refresh();
      } catch (error) {
        if (live) setError(message(error));
      } finally {
        if (live) setLoading(false);
      }
    })();
    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setTimeout(() => {
          if (live) void refresh().catch((error) => setError(message(error)));
        }, 0);
      }
    });
    return () => {
      live = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, [refresh]);
  async function signOut() {
    if (mode === 'supabase') {
      const { error } = await supabase!.auth.signOut();
      if (error) throw error;
    } else await api('/auth/logout', { method: 'POST' });
    setProfile(null);
  }
  async function update(input: ProfileInput) {
    setProfile(await api<Profile>('/me', { method: 'PATCH', body: JSON.stringify(input) }));
  }
  async function updateAppearance(appearance: Appearance) {
    setProfile(
      await api<Profile>('/me/appearance', { method: 'PATCH', body: JSON.stringify(appearance) }),
    );
  }
  async function updateLanguage(language: 'en' | 'ru') {
    setProfile(
      await api<Profile>('/me/language', { method: 'PATCH', body: JSON.stringify({ language }) }),
    );
  }
  return (
    <AuthContext.Provider
      value={{
        profile,
        mode,
        loading,
        error,
        refresh,
        signOut,
        update,
        updateAppearance,
        updateLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing.');
  return value;
}
