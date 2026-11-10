import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { ru } from './ru';
export type Language = 'en' | 'ru';
export function translate(text: string, language: Language): string {
  if (language === 'en') return text;
  if (Object.hasOwn(ru, text)) return ru[text];
  const size =
    /^Too (small|big): expected (string|array) to have ([<>]=)(\d+) (characters|items)$/.exec(text);
  if (size)
    return `${size[1] === 'small' ? 'Минимум' : 'Максимум'} ${size[4]} ${size[2] === 'string' ? 'символов' : 'элементов'}.`;
  if (text.startsWith('Missed ')) return `Пропуск ${text.slice(7)}`;
  const activity =
    /^(Proposed|Accepted the rules for|Withdrew from|Cancelled|Activated) (.+)$/.exec(text);
  if (activity)
    return (
      (
        {
          Proposed: 'Предложено',
          'Accepted the rules for': 'Приняты правила',
          'Withdrew from': 'Отказ от участия в',
          Cancelled: 'Отменено',
          Activated: 'Началось',
        } as Record<string, string>
      )[activity[1]] +
      ' ' +
      activity[2]
    );
  return text;
}
function initial(): Language {
  try {
    return localStorage.getItem('stakeup.language.v1') === 'ru' ? 'ru' : 'en';
  } catch {
    return 'en';
  }
}
const Context = createContext({
  language: 'en' as Language,
  t: (s: string) => s,
  save: async (_language: Language) => {},
});
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile, updateLanguage } = useAuth(),
    [local, setLocal] = useState(initial),
    language = profile?.language ?? local;
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem('stakeup.language.v1', language);
    } catch {}
  }, [language]);
  async function save(next: Language) {
    if (profile) await updateLanguage(next);
    setLocal(next);
  }
  return (
    <Context.Provider value={{ language, t: (s) => translate(s, language), save }}>
      {children}
    </Context.Provider>
  );
}
export function useI18n() {
  return useContext(Context);
}
export function LocalizedText({ text }: { text: string }) {
  return useI18n().t(text);
}
