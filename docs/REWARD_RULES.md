# Proposed virtual reward policy v1 (implementation: phase 4)

All amounts are integer virtual cents. No real monetary value. Rules, formula version and eligibility threshold are accepted before activation and then locked.

- Scheduled obligations follow the challenge timezone/weekday policy. Successful days are accepted evidence only. Pending/disputed evidence blocks settlement.
- Grace days apply chronologically to the earliest missed obligations, do not incur penalties, and are excluded from the completion denominator. An accepted day always counts as success.
- Discipline score = accepted obligations / (scheduled obligations - allocated grace days), represented as exact integers. No scored obligations means ineligible. Initial eligibility is at least 80%; compare integer cross-products rather than rounded UI percentages.
- Early leavers remain subject to accepted obligations through challenge end (no new social access after departure). Leaving is disabled in the MVP while participating in an active challenge. A future explicit forfeit flow requires separate accepted rules; it must not silently evade penalties.
- Each resolved missed/rejected obligation incurs min(per-day penalty, remaining participant cap). Unique participant/date/reason keys prevent duplicate charges. No penalty is final for an open dispute.
- Eligible participants share the final pool in proportion to discipline scores using rational arithmetic. Floor allocations first; allocate remaining cents by descending fractional remainder, then stable participant UUID ascending. Ties in rankings share a rank; payout tie-breaking is purely deterministic.
- A zero pool generates zero allocations. With no eligible participant, refund contributions to their sources proportionally (largest remainder, same UUID tie-break), recording a refund settlement instead of inventing a winner.
- Settlement locks the challenge, requires every obligation and dispute finalized, posts balanced virtual entries and a unique distribution record in one transaction. Sum of reward/refund allocations equals the entire pool. After settlement, the challenge pool balance is zero.

Before phase 4, test conservation, caps, no eligible participants, exact ties, zero denominators, large amounts, retries, concurrent workers and unresolved disputes. These are proposed rules, not currently executable accounting.
