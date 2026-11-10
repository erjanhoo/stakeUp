# Community, language and chosen grace days

## Scope

Milestone 5 adds a private in-app notification inbox, comments and three encouragement reactions on submitted proof, personal achievement history, monthly recaps and a completion celebration. Settings has English/Russian and independent dark/light plus orange/lime preferences. A piggy-bank mark identifies the virtual pool; accents now reach navigation, outlines, icons, focus states and data views.

Notifications are structured events translated when rendered. User names, challenge titles, proof notes and comments remain as written. Language is saved on the account and cached locally for the next visit. Date/number display follows the selected language; authoritative timezone calculations retain ISO calendar dates.

Comments are plain text, limited to 1,000 characters, readable only by current Circle members. Authors can soft-delete their own comments. Reactions toggle per person/type and never count as review votes. Conversations fetch only when opened to avoid a request per submission when viewing long histories.

## Grace policy v2

New proposals include `rewardPolicy: discipline_v2` and `gracePolicy: chosen_v1` in the immutable rule snapshot. Accepted v1 rules remain unchanged and continue their automatic earliest-miss allocation.

Enrolled participants reserve their own scheduled dates on the proof page before the relevant upload deadline. Future dates can be selected before their upload window opens. The allowance applies across the whole challenge. Selection and cancellation serialize with uploads, review and settlement on the challenge lock. Already submitted days cannot be excused, and choices cannot be changed after the deadline. A reserved-but-unfinished upload cannot finish while its day is excused; cancelling before the deadline restores upload eligibility.

Chosen days incur no penalty, require no proof and are excluded from the discipline-score denominator. They do not add a successful day or break an existing streak. Unused days are never assigned automatically. All other reward rules, the 80% eligibility threshold, caps, exact allocation, no-eligible refunds and appeal period remain unchanged. Zero scored obligations means ineligible. Existing ledger and settled snapshots remain immutable.

## Notifications and recaps

Database triggers persist proposals for Circle members, activation/completion for accepted participants, proof decisions for the author, review requests for peers and comments for the proof author. `private.emit_community_notifications()` adds reminders within one hour of the deadline and missed-submission notices, excluding submitted or excused days. It also creates a previous-calendar-month recap in each user's timezone when they submitted proof. Recaps are a snapshot of statuses at generation time. Keys prevent duplicates on retries. Notifications are currently limited to the latest 100 in the inbox.

When pg_cron is installed, `stakeup-in-app-notifications` runs every five minutes. This is reliable in-app persistence, not background push: the bell polls once per minute while the app is open, and no email/push is sent. Job delays can delay reminders; reminders are never authoritative deadline evidence. Local mode generates the same events on transactions/reads, so unattended local reminders wait for the next app request.

## Migration and release

Apply **only** `supabase/migrations/20261110000400_community.sql` once after the five existing migrations. Never run the local bootstrap on Supabase. The new migration adds language, grace choices, notifications, comments/reactions and trusted RPC/trigger functions with RLS and restricted grants. It updates existing deadline/competition dispatchers with guards against an unexpected source version. Transactions roll back the whole migration on failure.

Deploy API before web after the database migration. No additional secrets or paid service is needed. Existing private Storage and honest AI mock remain in use. Verify the scheduled notification job in the managed dashboard after release.

## Remaining launch work

Physical iOS/Android camera testing, real-account managed Storage/review/settlement walkthroughs, cron run monitoring, account deletion and photo retention, larger-history pagination and distributed abuse controls remain. Vision-provider integration, photo similarity detection, push notifications and profile-avatar uploads are separate work. All balances remain strictly virtual.

Release preparation (2026-11-10): the user applied the new migration in Chrome and reported Success. Anonymous PostgREST execution returns 42501, confirming the new function is present and private. npm run check passes 33 tests, strict TypeScript, both builds and the production handler. All six PostgreSQL suites pass with real local role/RLS checks. All 12 desktop/mobile browser journeys passed. Checks include EN/RU, grace cancellation, notifications and proof conversations. The locale fallback and error boundary were then tightened and the two language journeys rerun. Deployment identifiers will be recorded after the live release.
