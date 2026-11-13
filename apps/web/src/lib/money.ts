import { useAuth } from './auth';
import { useI18n } from './i18n';
import { credits } from './social';

export function useMoney() {
  const { profile } = useAuth();
  const { language } = useI18n();
  return (minor: number) => credits(minor, language, profile?.currency ?? 'USD');
}
