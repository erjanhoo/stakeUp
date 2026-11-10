import type { CompetitionRow } from '@stakeup/contracts';
export function allocate(pool: number, rows: CompetitionRow[]) {
  const gcd = (a: bigint, b: bigint): bigint => (b ? gcd(b, a % b) : a);
  const eligible = rows.filter((r) => r.eligible),
    recipients = eligible.length ? eligible : rows.filter((r) => r.penaltyMinor > 0);
  let lcm = 1n;
  if (eligible.length)
    for (const r of recipients) {
      const d = BigInt(r.scheduled - r.grace);
      lcm = (lcm / gcd(lcm, d)) * d;
    }
  const weighted = recipients.map((r) => ({
    r,
    w: eligible.length
      ? (BigInt(r.successful) * lcm) / BigInt(r.scheduled - r.grace)
      : BigInt(r.penaltyMinor),
    remainder: 0n,
  }));
  const sum = weighted.reduce((n, x) => n + x.w, 0n);
  if (!pool || !sum) return rows;
  for (const x of weighted) {
    const numerator = BigInt(pool) * x.w;
    x.r.rewardMinor = Number(numerator / sum);
    x.remainder = numerator % sum;
  }
  let left = pool - weighted.reduce((n, x) => n + x.r.rewardMinor, 0);
  weighted.sort((a, b) =>
    a.remainder === b.remainder
      ? a.r.userId.localeCompare(b.r.userId)
      : a.remainder > b.remainder
        ? -1
        : 1,
  );
  for (const x of weighted) {
    if (!left--) break;
    x.r.rewardMinor++;
  }
  return rows;
}
