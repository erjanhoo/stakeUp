# Social challenges — milestone 2

Implemented in the repository on 2026-11-10; not yet released to the public preview.

## Working journey

Create an account → finish onboarding → create a private Circle → generate an invitation → a friend signs up and joins → any member proposes a challenge → both explicitly accept the published rules → the proposer or Circle owner activates it → each participant sees their frozen schedule. Settings saves independent dark/light and orange/electric-lime choices per account. Registration and recovery require at least eight characters.

Circle owners can edit details, generate invitations and archive an inactive Circle. Members can leave after withdrawing from any proposed challenge. Active participants cannot leave. Owners must stay; ownership transfer and active forfeiture are deferred. Archiving preserves history, cancels proposals and prevents further mutations.

## Invariants

- Circle access requires current membership. No public directory or invitation preview reveals private names. Member summaries expose display name and username, never email, bio, timezone or appearance preferences.
- Invitations contain 256 random bits, expire after seven days and admit up to 25 new members. Only their SHA-256 digests persist. Reusing an invitation as a current member does not consume another use. Limits: 20 memberships per account, 50 active members per Circle and 25 non-cancelled challenges per Circle.
- Invitation links put the token in a URL fragment, clear it from the address bar, and retain it in tab-scoped session storage through signup/onboarding. Email confirmation opened in another tab may require reopening the original invitation. This is a bearer invitation: anyone given it may join while valid.
- Publishing makes rules immutable, including title, dates, IANA timezone, selected weekdays, local cutoff, evidence/capture policy, integer penalty/cap, grace days and the fixed `discipline_v1` reward policy. Cancel and recreate a proposal to change rules.
- The creator is not automatically enrolled. Every participant accepts an exact server-issued hash; Supabase retains the accepted snapshot and server timestamp. Withdrawal is allowed only before activation. Activation requires two accepted members, runs atomically, and freezes the roster.
- Start date must be tomorrow or later in the challenge timezone. Inclusive duration is 1–90 days. At least one weekday must occur; grace days must be fewer than scheduled days. Camera-only is currently a stored rule, not a claim that the browser can prove photo capture time.
- Activation resolves each civil date/cutoff to UTC. Overlaps choose the later instant; skipped cutoffs move forward by the DST gap. For New York, 2027-03-14 02:30 resolves to 07:30Z (03:30 local), and 2027-11-07 01:30 resolves to 06:30Z. Deadlines stay fixed after activation.
- Obligation identity is unique per challenge, participant and local date. Repeated activation is rejected and never duplicates schedules. Dashboard commitments use today's date in each challenge's timezone.
- Production RPCs check the authenticated user, authorize membership/ownership and serialize writes using actor advisory locks plus Circle/challenge row locks. Exposed tables have RLS; clients have no direct social-table mutation grants. Internal JSON/event helpers cannot be invoked by clients. API calls use user-scoped Supabase credentials, never service-role access.

## Explicit boundaries

This milestone creates schedules but does not run deadline jobs or mark misses. Evidence uploads, private Storage, AI/peer review, disputes and profile/Circle photos arrive in phase 3. Virtual penalties, ledger entries, standings and settlement arrive in phase 4. Until settlement exists, active challenges remain locked even after their last date. No money is collected, and the UI identifies these limits before acceptance/activation.

Circle events cover membership and challenge actions. Comments, reactions, notification delivery, achievements and recaps remain phase 5. Current avatars are selectable icons or initials. Circle deletion, ownership transfer, invitation revocation controls and active forfeiture are not shipped; short invitation expiry and archiving are the current controls.

## Reproduce database checks

Use a **disposable** PostgreSQL 17 database with administrative access. For plain PostgreSQL only, run `supabase/tests/bootstrap-local.sql` first; it supplies minimal Auth roles and `auth.uid()` and must never be run on Supabase. Then run both migration files in timestamp order, followed by `supabase/tests/foundation.sql` and `supabase/tests/social_challenges.sql`, with `psql -v ON_ERROR_STOP=1`. Both authorization scripts roll back their fixtures. CI performs this sequence in a fresh PostgreSQL service.

These checks exercise real PostgreSQL grants, RLS, RPC mutations, immutable snapshots, invite expiry/idempotency, role restrictions, account preference isolation, schedule uniqueness and DST agreement. The minimal Auth fixture does not verify Supabase JWT verification, PostgREST or email delivery. A connected staging journey is still required before release.

See [deployment sequence](DEPLOYMENT.md) and [virtual reward policy](REWARD_RULES.md).
