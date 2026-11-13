import type { ReactNode } from 'react';
import { HelpTip } from './help-tip';

export function About({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="about-help">
      <HelpTip title={title}>{children}</HelpTip>
    </div>
  );
}
