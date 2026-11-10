# Virtual reward policies

All amounts are integer virtual cents. No real monetary value. Phase 2 records `rewardPolicy: discipline_v1` in the hashed immutable rules snapshot and explicit acceptance record. This version fixes the 80% threshold and rules below; changing them requires a new version and a new proposal. Accounting is implemented in the competition milestone; see COMPETITION.md for release status.

- Scheduled obligations follow the challenge timezone/weekday policy. Successful days are accepted evidence only. Pending/disputed evidence blocks settlement.
- Grace days apply chronologically to the earliest missed obligations, do not incur penalties, and are excluded from the completion denominator. An accepted day always counts as success.
- Discipline score = accepted obligations / (scheduled obligations - allocated grace days), represented as exact integers. No scored obligations means ineligible. Initial eligibility is at least 80%; compare integer cross-products rather than rounded UI percentages.
- Early leavers remain subject to accepted obligations through challenge end (no new social access after departure). Leaving is disabled in the MVP while participating in an active challenge. A future explicit forfeit flow requires separate accepted rules; it must not silently evade penalties.
- Each resolved missed/rejected obligation incurs min(per-day penalty, remaining participant cap). Unique participant/date/reason keys prevent duplicate charges. No penalty is final for an open dispute.
- Eligible participants share the final pool in proportion to discipline scores using rational arithmetic. Floor allocations first; allocate remaining cents by descending fractional remainder, then stable participant UUID ascending. Ties in rankings share a rank; payout tie-breaking is purely deterministic.
- A zero pool generates zero allocations. With no eligible participant, refund contributions to their sources proportionally (largest remainder, same UUID tie-break), recording a refund settlement instead of inventing a winner.
- Settlement locks the challenge, requires every obligation and dispute finalized, posts balanced virtual entries and a unique distribution record in one transaction. Sum of reward/refund allocations equals the entire pool. After settlement, the challenge pool balance is zero.

Amounts are provisional until final settlement, which also waits at least 24 hours after the last deadline/review event. Tests cover conservation, caps, no eligible participants, exact ties, zero pools, retries, worker processing and unresolved disputes. Real concurrent multi-session stress tests remain part of broader launch hardening.

## Chosen grace policy v2

New proposals use discipline_v2/chosen_v1. Participants reserve scheduled dates before their deadline; those dates are excused and excluded from the score denominator. No automatic allocation of unused allowance. Existing v1 snapshots retain their accepted automatic policy. All other rules above remain unchanged. See COMMUNITY.md for ownership, upload locking and cancellation rules.
