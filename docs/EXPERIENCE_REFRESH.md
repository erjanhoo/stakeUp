# Experience refresh — 14 November 2026

The database update has been applied directly through the connected Supabase plugin. API and website deployment are in progress.

## What changed

- A shared system sans-serif font, larger secondary labels, rounded controls, responsive page actions, and consistent hover, focus and pressed states. Circle cards show an accent highlight traveling around their border. Reduced-motion preferences are respected.
- Circle names, card backgrounds and the new More link open the workspace. Avatar/profile links retain their own targets.
- Join buttons open an invitation input in place. Legacy `/join#token=…` links retain invitations through authentication and onboarding, then open the same input. The separate joining page and roadmap content were removed; old route URLs redirect.
- Returning authenticated visitors enter their workspace directly from `/` after session restoration.
- Calendar day pages have an explicit Back to calendar button that restores the selected month and calendar position. Available passes can excuse missed days before final settlement. Older challenges expose their existing automatic allowance in the calendar and can reserve passes within that same allowance.
- Circle pool projections and calendar grace states share one calculation. Excused days are excluded from misses. Submitted proof awaiting a review decision remains pending. Contributions are visible before final settlement; settlement retains the existing appeal window, caps, eligibility rules and balanced payouts.
- Achievements use one animated progress track with five levels: First Spark, Rhythm Finder, Momentum Maker, Orbit Keeper and North Star. Accepted proof earns 10 points and completed challenges earn 50.
- Blue and violet join orange and lime, with dark/light appearances. Accent colors also apply to active upload windows, secondary controls and the offline screen.
- Eight additional icons: rocket, mountain, heart, coffee, brain, bike, music and target.
- Account-level display currencies: USD, KGS, EUR, RUB, GBP and KZT. All displayed challenge and pool amounts use the selected unit. Changing units preserves numeric amounts and does not apply exchange rates.
- Persistent balance top-ups, account-private history, idempotent retry handling and settled stake/reward/refund reconciliation. Pending stakes are displayed separately from posted balance entries.
- Secondary explanations use About dropdowns. Repetitive currency disclaimers were removed from rendered pages.

## Release order

1. Apply `supabase/migrations/20261113180125_experience_wallet.sql` to the existing Supabase project `bwtpxrjcubvvsvnsjigm`, after all preceding migrations. It extends theme/icon constraints, adds the currency preference, exposes effective grace consistently, and creates the protected top-up table and wallet RPC.
2. Deploy the API project `stakeup-api` (`prj_eQG65mLRJ5wJTof5TipVqDCDew7V`).
3. Deploy the web project `stakeup` (`prj_aSTf4Qjk10x1wiSc3etMGXGkbqwk`). Preserve the existing public audience and domains.
4. Verify a returning signed-in account, a saved currency/theme change, a top-up, invitation joining and a missed-day pass against the managed services.

The migration is transactional and does not rewrite accepted challenge snapshots or completed settlements. The new top-up records are owner-readable through RLS; direct client inserts are denied. The wallet RPC derives its user from the authenticated session and serializes repeated top-up requests.

## Verification

- TypeScript, 40 unit/API tests, web/API builds, and the exact production API bundle HTTP checks.
- All migrations and nine PostgreSQL authorization/behavior suites in a fresh isolated PostgreSQL 17 instance, including top-up isolation, retry protection, legacy grace visibility, pending contributions and settlement reconciliation.
- All 18 desktop/mobile browser journeys passed, including homepage session restoration, currency/top-ups, four accents, circle navigation, invitations, achievements, grace/calendar return navigation, review/appeal flows and settlement. Three interrupted journeys were rerun successfully after stopping overlapping dev-server restarts. Responsive checks include 1440, 1024, 820, 390 and 320 pixels.

Supabase connected successfully. Migration `20261113180125_experience_wallet` is applied to StakeUp (`bwtpxrjcubvvsvnsjigm`). Live schema, RLS, function privileges, and transactional top-up/retry checks passed. Transactional test top-ups were rolled back; no account balance was changed. Earlier migrations were applied manually and have no history entries; do not rerun them.
