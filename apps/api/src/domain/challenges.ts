import { Temporal } from '@js-temporal/polyfill';
import { createHash } from 'node:crypto';
import type { ChallengeRules } from '@stakeup/contracts';
import { AppError } from '../errors.js';

export function schedule(rules: ChallengeRules) {
  const start = Temporal.PlainDate.from(rules.startDate);
  const end = Temporal.PlainDate.from(rules.endDate);
  if (start.until(end).days > 89) throw new AppError(400, 'Challenges can last at most 90 days.');
  const days: { localDate: string; deadlineAt: string; opensAt: string }[] = [];
  for (let day = start; Temporal.PlainDate.compare(day, end) <= 0; day = day.add({ days: 1 })) {
    if (!rules.weekdays.includes(day.dayOfWeek % 7)) continue;
    const deadline = day
      .toPlainDateTime(rules.cutoff)
      .toZonedDateTime(rules.timezone, { disambiguation: 'later' });
    const opening = day
      .toPlainDateTime(rules.opening ?? '00:00')
      .toZonedDateTime(rules.timezone, { disambiguation: 'later' });
    if (opening.epochMilliseconds >= deadline.epochMilliseconds)
      throw new AppError(
        400,
        'The upload window collapses across a clock change. Choose different times.',
      );
    days.push({
      localDate: day.toString(),
      deadlineAt: deadline.toInstant().toString(),
      opensAt: opening.toInstant().toString(),
    });
  }
  if (!days.length)
    throw new AppError(400, 'Choose at least one scheduled day within these dates.');
  if (rules.graceDays >= days.length)
    throw new AppError(400, 'Grace days must be fewer than scheduled days.');
  return days;
}
export function requireFutureStart(rules: ChallengeRules, now = Temporal.Now.instant()) {
  if (rules.startDate <= now.toZonedDateTimeISO(rules.timezone).toPlainDate().toString())
    throw new AppError(409, 'Choose a start date from tomorrow onward in the challenge timezone.');
}
export function rulesHash(rules: ChallengeRules) {
  // A hash is accepted as an opaque server-issued identity; clients never calculate it.
  return createHash('sha256').update(JSON.stringify(rules)).digest('hex');
}
export function localToday(timezone: string) {
  return Temporal.Now.zonedDateTimeISO(timezone).toPlainDate().toString();
}
