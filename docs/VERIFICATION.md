# Verification — 2026-11-10

Milestones 1 and 2 are live at https://stakeup-olive.vercel.app. The user verified confirmation emails, signup, Circle creation and friend invitation joining. GitHub is now linked to both Vercel projects; production tracks erjanhoo/social-challenges. Earlier limitations in PUBLIC_PREVIEW.md are historical.

Milestone 3 adds private photo submission, status/history, the honest development mock, peer quorum decisions and disputes. The landing-page card grid is replaced by an animated connected commitment trail with typography and shaped illustrations. Reduced-motion styles and all four appearance combinations remain supported.

## Local checks

- npm run check: strict TypeScript, 21 API/domain/client tests, both builds and the bundled production handler pass.
- Six existing desktop/mobile browser journeys passed. The new three-account evidence journey passed on both sizes: image submission, private photo rendering, no self-review controls, quorum rejection, owner appeal, fresh two-peer acceptance and retained history. An overly broad status locator was corrected to distinguish the success notice from photo loading.
- Foundation, social and evidence migrations plus all three authorization scripts passed in isolated PostgreSQL 17. Authenticated/anon roles exercise real grants and RLS. Evidence checks cover private Storage metadata policies, forged AI payloads, self-review, duplicate votes, quorum, disputes and outsider reads. Fixtures roll back.
- Screenshots reviewed for the redesigned landing and evidence page at desktop/mobile sizes; horizontal overflow checks pass. These are Chromium emulations, not physical device/Safari checks.

## Release status and limits

The user applied the evidence migration in Supabase and reported Success. API deployment dpl_4ArHkFZ1xN7Z96cR7pgjtV6jEiqk and web deployment dpl_HGro4h1p55ATBnxzv1dFnXgCvRHB reached READY from code commit 972a6b2. Public desktop/mobile trail checks, eight-character form, protected evidence routes/photos, health, Blob CSP and absence of page errors passed. Anonymous database/RPC access and public bucket access were rejected. Managed authenticated upload/download remains to be exercised with real user accounts. No service-role key is needed. Supabase dashboard auth is unavailable in the in-app browser; Chrome was used by the user for migration.

The mock does not analyze image contents and never accepts/rejects proof. Paid vision integration and duplicate/similarity detection are not implemented. Camera capture does not attest time or identity. Two-person circles can endorse ordinary proof but cannot reach rejection or dispute quorum; unresolved reviews cannot finalize penalties.

Financial deadline jobs, ledger, grace allocation, rewards, settlement, notifications, avatar uploads, retention/account deletion and larger-history pagination remain deferred. Process-local rate limiting needs platform-level controls as usage grows. Managed upload/download, signed-in production review journeys and physical camera behavior still require live verification.

## Upload-window and competition checkpoint

The repository now includes configurable frozen opening times, all-member acceptance summaries, standings, provisional virtual penalties, grace/caps and exact final ledger/rewards. 26 domain/API/client tests and strict TypeScript pass. All five PostgreSQL authorization scripts passed against fresh PostgreSQL 17, including storage opening policy, outsider isolation, immutable transactions, exact 752-unit allocation, refund worker retries and post-settlement restrictions. The pg_cron extension itself is not available in the local PostgreSQL fixture; its worker is exercised directly. Managed job installation still needs live verification.

The user applied the combined two-migration file in Supabase and reported Success. Both new competition RPCs are present and deny anonymous execution. All 10 desktop/mobile browser journeys passed after widening only the explicitly isolated local E2E server request budget; production limits remain the configured defaults. API dpl_737t5FnyeTDzaWGTruVakuTyBtp4 and web dpl_7Fe1jMCxUKf1e39uEGJ5u2psWTWx reached READY from commit efe4fa2. Public health, protected competition/evidence routes, login redirects, desktop/mobile layout, Blob CSP and page-error checks passed. The production branch was fast-forwarded to the tested release. Scheduled job run logs and signed-in real-account settlement still require operational verification; local worker and browser settlement journeys passed. Existing published challenge rules are preserved, with a midnight opening fallback. See COMPETITION.md for policies and release steps.


Community/localization release: the user applied 20261110000400_community.sql and reported Success. API dpl_6igTyAFKu6GT4VuCGqt1xfDgn47P and web dpl_2qmHKF1tKpJbMunS1M2G3VY2Uk95 reached READY from code commit 4e13c0b. All 33 unit/API/client tests, six PostgreSQL suites and 12 desktop/mobile browser journeys passed; the two language journeys also passed again after locale/error-boundary tightening. Public EN/RU landing/login, private API/deep-link authorization, health, responsive layouts, eight-character password and CSP checks passed. Managed signed-in real-user Storage/review/settlement and scheduled-job run history remain operational verification work.


## Profile/calendar release — 2026-11-11

The approved Stitch redesign is published as the primary production interface from `e84ef94`. The follow-up adds membership-scoped profiles and private avatars, Circle calendars with daily proof/review/conversation views, one-use missed-day grace bypasses, derived points and visible badge milestones, natural Russian team terminology, help popovers, themed pickers and interaction motion. See PROFILE_CALENDAR.md for exact behavior and privacy boundaries.

Both new migrations were applied to the managed production database through its SQL Editor, which returned Success. All seven PostgreSQL authorization suites pass against isolated PostgreSQL 17. `npm run check` passes TypeScript, 35 tests, both builds and the bundled API HTTP check. All 14 desktop/mobile journeys pass, including accepted-photo badge rewards, no-photo grace bypass, avatar upload and shared-membership profile access. New profile layouts also pass a 320px overflow assertion. CI includes both new migrations and the seventh SQL suite.

No automated test signed into a live user account or changed live user photos/proof. Physical-device camera behavior and managed signed-in Storage/review/settlement walkthroughs remain operational checks. The Vite build reports a 644 kB initial JS chunk warning; route-specific modules are still lazy-loaded. There is no paid vision provider, push integration or app-store package in this release.


The final public check caught a Russian landing-page overflow at 320px, caused by the example/FAQ grid's minimum-content width and the long CTA's no-wrap text. The grid now uses a shrinkable track and the CTA wraps. All 24 combinations of language, theme and 1440/390/320px width pass against the connected local preview. The four affected community/profile desktop/mobile journeys also passed after picker/popover corrections. One unit run timed out under concurrent browser load; the complete check passed when run separately, with all 35 tests and both builds.
