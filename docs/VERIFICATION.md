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

The user applied the combined two-migration file in Supabase and reported Success. Both new competition RPCs are present and deny anonymous execution. All 10 desktop/mobile browser journeys passed after widening only the explicitly isolated local E2E server request budget; production limits remain the configured defaults. Production deployment is pending. Existing published challenge rules are preserved, with a midnight opening fallback. See COMPETITION.md for policies and release steps.
