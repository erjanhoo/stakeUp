import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
const Context = createContext({
  installed: false,
  canInstall: false,
  online: true,
  workerError: false,
  install: async () => 'unavailable' as string,
});
export function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null),
    [installed, setInstalled] = useState(false),
    [online, setOnline] = useState(navigator.onLine),
    [workerError, setWorkerError] = useState(false);
  useEffect(() => {
    const mode = matchMedia('(display-mode: standalone)');
    const updateMode = () =>
      setInstalled(
        mode.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const connection = () => setOnline(navigator.onLine);
    updateMode();
    mode.addEventListener('change', updateMode);
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', complete);
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    let registration: ServiceWorkerRegistration | undefined;
    let live = true;
    const register = () => {
      if (!('serviceWorker' in navigator)) return;
      void navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((r) => {
          if (live) registration = r;
        })
        .catch(() => {
          if (live) setWorkerError(true);
        });
    };
    const checkUpdate = () => {
      if (document.visibilityState === 'visible' && navigator.onLine)
        void registration?.update().catch(() => {});
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
    document.addEventListener('visibilitychange', checkUpdate);
    return () => {
      live = false;
      mode.removeEventListener('change', updateMode);
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', complete);
      window.removeEventListener('online', connection);
      window.removeEventListener('offline', connection);
      window.removeEventListener('load', register);
      document.removeEventListener('visibilitychange', checkUpdate);
    };
  }, []);
  async function install() {
    if (!prompt) return 'unavailable';
    setPrompt(null); // A browser install event can only be consumed once.
    await prompt.prompt();
    return (await prompt.userChoice).outcome;
  }
  return (
    <Context.Provider value={{ installed, canInstall: !!prompt, online, workerError, install }}>
      {children}
    </Context.Provider>
  );
}
export function usePwa() {
  return useContext(Context);
}
