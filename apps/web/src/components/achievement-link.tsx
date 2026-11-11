import { Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export function AchievementLink() {
  const { t } = useI18n();
  return (
    <Link
      className="st-achievement-entry"
      to="/app/profile"
      aria-label={t('View badges and points')}
    >
      <Award size={26} />
      <span>
        <strong>{t('Achievements')}</strong>
        <small>{t('View your badges and progress points.')}</small>
      </span>
      <ArrowRight size={20} />
    </Link>
  );
}
