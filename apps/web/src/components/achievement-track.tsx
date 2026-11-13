import { Check, Sparkles } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export const milestones = [
  { points: 10, name: 'First Spark' },
  { points: 70, name: 'Rhythm Finder' },
  { points: 300, name: 'Momentum Maker' },
  { points: 600, name: 'Orbit Keeper' },
  { points: 1000, name: 'North Star' },
];

export function AchievementTrack({ accepted, completed }: { accepted: number; completed: number }) {
  const { t } = useI18n();
  const points = accepted * 10 + completed * 50;
  const next = milestones.find((m) => m.points > points);
  const current = milestones.filter((m) => m.points <= points).at(-1);
  return (
    <div className="achievement-track">
      <div className="achievement-heading">
        <span className="achievement-emblem">
          <Sparkles size={23} />
        </span>
        <div>
          <small>{t('Your current level')}</small>
          <h3>{t(current?.name ?? 'Ready to Rise')}</h3>
        </div>
        <strong>
          {points}
          <small>{t('points')}</small>
        </strong>
      </div>
      <div
        className="achievement-line"
        role="progressbar"
        aria-label={t('Achievement progress')}
        aria-valuemin={0}
        aria-valuemax={1000}
        aria-valuenow={Math.min(points, 1000)}
        aria-valuetext={`${points} ${t('points')}. ${next ? `${next.points - points} ${t('to')} ${t(next.name)}` : t('All milestones unlocked')}`}
      >
        {milestones.map((m, i) => {
          const previous = milestones[i - 1]?.points ?? 0;
          const progress = Math.max(
            0,
            Math.min(100, (100 * (points - previous)) / (m.points - previous)),
          );
          return (
            <div
              className={`achievement-stage ${points >= m.points ? 'is-earned' : ''}`}
              key={m.name}
            >
              <div className="achievement-segment">
                <i style={{ width: `${progress}%` }} />
              </div>
              <span className="achievement-node">
                {points >= m.points ? <Check size={12} /> : i + 1}
              </span>
            </div>
          );
        })}
      </div>
      <div className="achievement-goals">
        {milestones.map((m) => (
          <div key={m.name} className={points >= m.points ? 'is-earned' : ''}>
            <strong>{t(m.name)}</strong>
            <small>
              {m.points} {t('points')}
            </small>
          </div>
        ))}
      </div>
      <p className="achievement-next" aria-live="polite">
        {next ? (
          <>
            {next.points - points} {t('points to')} <strong>{t(next.name)}</strong>
          </>
        ) : (
          t('All milestones unlocked. Keep your momentum going.')
        )}
      </p>
    </div>
  );
}
