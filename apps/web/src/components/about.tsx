import type { ReactNode } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export function About({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <details className="about-dropdown">
      <summary>
        <Info size={17} />
        <span>{t(title)}</span>
        <ChevronDown size={17} />
      </summary>
      <div className="about-content">{children}</div>
    </details>
  );
}
