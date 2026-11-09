import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { appearanceSchema, type Appearance } from '@stakeup/contracts';
import { useAuth } from './auth';
const KEY = 'stakeup.appearance.v1';
function initial(): Appearance {
  try {
    return appearanceSchema.parse(JSON.parse(localStorage.getItem(KEY) || 'null'));
  } catch {
    return { mode: 'dark', accent: 'orange' };
  }
}
const Context = createContext<{
  appearance: Appearance;
  save: (value: Appearance) => Promise<void>;
  busy: boolean;
} | null>(null);
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { profile, updateAppearance } = useAuth();
  const [local, setLocal] = useState(initial);
  const [busy, setBusy] = useState(false);
  const appearance = profile?.appearance ?? local;
  useEffect(() => {
    document.documentElement.dataset.mode = appearance.mode;
    document.documentElement.dataset.accent = appearance.accent;
    try {
      localStorage.setItem(KEY, JSON.stringify(appearance));
    } catch {
      /* Private browsing may disable storage. */
    }
  }, [appearance.mode, appearance.accent]);
  async function save(value: Appearance) {
    setBusy(true);
    try {
      if (profile) await updateAppearance(value);
      setLocal(value);
    } finally {
      setBusy(false);
    }
  }
  return <Context.Provider value={{ appearance, save, busy }}>{children}</Context.Provider>;
}
export function useAppearance() {
  const value = useContext(Context);
  if (!value) throw new Error('AppearanceProvider is missing.');
  return value;
}
