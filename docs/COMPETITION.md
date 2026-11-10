# Upload windows and virtual competition

## Upload windows and enrollment

New proposals have an opening time and closing time on the same challenge-local day (for example 08:00–09:00). Opening must precede closing. Both instants are frozen in UTC at activation with the existing DST-later policy; collapsed DST windows are rejected. Server reservation and private Storage upload policies enforce the opening and deadline, independently of the device clock. The existing server receipt deadline still applies. Frontend availability refreshes every 15 seconds.

Previously published rules remain immutable. Their window starts at midnight, preserving the behavior participants accepted; changing a live challenge to an 08:00 opening requires a new proposal. No existing rule hash is rewritten. Circle challenge summaries and challenge details now include every current member's acceptance status. Only accepted members enroll; others sit out. Activation still requires two accepted people and locks that roster.

## Virtual competition behavior

Standings are computed from actual obligations and proof decisions. Accepted photos count as successful days. After a missed deadline, no photo or an unfinished upload is a miss; received evidence awaiting review or under dispute remains unresolved. Earliest misses use grace days first, then integer daily penalties up to the accepted participant cap. Streaks follow consecutive scheduled successes; an unresolved past day breaks a confirmed streak. Future days remain pending.

Amounts remain **provisional** during the challenge: the projected shared pool and participant penalties can change as reviews resolve. This milestone deliberately posts final ledger entries only in a single atomic settlement. It never charges an unresolved dispute. A final result requires every deadline to pass, all submitted evidence to be accepted/rejected, and at least 24 hours since the final deadline or latest review event. The extra period gives participants time to appeal a late rejection. Completed challenges close further review mutations and release the existing active-participant leave restriction.

The ledger records positive integer minor-unit entries: participant-to-pool penalties and pool-to-participant rewards/refunds. Each entry has a UUID, user, reason and timestamp; penalty entries also identify the obligation. A unique settlement per challenge, a unique penalty per obligation and a unique distribution per participant protect retries. The database locks the challenge and serializes evidence mutations on that same lock. A balance check requires all penalty inflows to equal reward/refund outflows before commit. Clients cannot insert, update or delete ledger/distribution rows.

Reward policy remains discipline_v1: 80% success after allocated grace. Eligible users split the pool by their exact rational scores. PostgreSQL numeric LCM/integer division and local BigInt arithmetic avoid floating-point allocation errors. Largest remainders receive leftover minor units, then UUID order breaks exact ties. Rankings share positions for equal exact scores. If nobody qualifies, contributions are refunded to their sources. Zero pools create zero-value distributions without ledger entries. Historical settled pool and remaining pool (zero) are shown separately.

## Scheduled processing

The Supabase migration installs/enables pg_cron when available and registers `stakeup-virtual-settlement` every five minutes. The private worker processes up to 20 ready challenges per run, excluding unresolved reviews and recent review events so they cannot starve later ready challenges. The worker is not callable by authenticated/anonymous API users. Ordinary members can request finalization of a ready challenge, but the database independently checks every prerequisite and calculates all amounts. No request accepts client-supplied balances, outcomes or timestamps.

Plain PostgreSQL CI may not have pg_cron; it tests the same worker directly. Local JSON development uses explicit finalization from the standings page. On managed Supabase, verify the scheduled job under Integrations → Cron after applying the migration. See [Supabase Cron installation](https://supabase.com/docs/guides/cron/install).

## Release and checks

Apply `20261110000200_upload_windows.sql` then `20261110000300_competition.sql` to the already-migrated project. The generated `.local/stakeup-windows-competition-release.sql` combines only those two files for dashboard application. Do not rerun the foundation/social/evidence migrations or the plain PostgreSQL bootstrap. API must deploy before web because the dashboard now requests competition totals.

Tests cover opening/closing enforcement, DST collapse, all-member enrollment visibility, exact allocation across different denominators, tie rounding, grace, caps, no-eligible refunds, zero pools, unresolved disputes, the appeal period, settlement retries, balanced ledger totals, client write denial, outsider privacy, worker retries, final review locks and leaving after completion. Database fixtures roll back. Desktop/mobile browser journeys verify enrollment labels, window creation, final results, ledger persistence and responsive layout.

Remaining: real-money payments are intentionally absent. Push/in-app notifications, comments/reactions, recap delivery, paid vision integration, avatar uploads, pagination and retention/account deletion remain future work. Provisional penalty history is a projection, not a mutable monetary ledger. No automatic negative outcome is inferred from missing peer-review quorum.

Release checkpoint: the user applied both migrations through Chrome and reported Success. API dpl_737t5FnyeTDzaWGTruVakuTyBtp4 and web dpl_7Fe1jMCxUKf1e39uEGJ5u2psWTWx reached READY from efe4fa2. All 26 automated tests, ten desktop/mobile journeys, five PostgreSQL suites and public routing/authorization checks passed. Live signed-in settlement and managed Cron run history remain operational checks.
