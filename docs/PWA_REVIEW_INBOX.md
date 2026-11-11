# Installable StakeUp and review inbox

## User flows

`/install` is a public, localized installation guide linked from the landing footer and Settings. It offers device-specific instructions for iPhone/iPad, Android and Windows. When Chromium supplies a `beforeinstallprompt` event, the page offers the native install prompt through a user-clicked button. Accepted/dismissed choices are reported honestly; installed app mode is detected using display-mode and iOS standalone state. There is no account requirement for the guide and no automatic installation or permission request.

The manifest supplies the stable app ID `/`, standalone display, `/app?source=pwa` launch URL, dark launch colors, regular 192/512px icons, a safe-zone maskable 512px icon, an Apple touch icon and review/Circle shortcuts. Icons reuse StakeUp's existing bolt mark with the orange brand color. To regenerate them after changing the source SVG, run `node apps/web/scripts/generate-icons.mjs` from the workspace after `npm ci`. The generated public PNG/SVG files are committed; no image service is used. The document theme color follows appearance mode, and standalone layouts account for safe-area insets.

The installed app and website share the same deployed frontend/API and account. Some platforms may require signing in again. This is browser installation, not App Store/Google Play packaging. iOS installation and menu placement depend on Safari/iOS versions; the guide includes the optional Open as Web App control without pretending it exists everywhere.

## Offline privacy and updates

The service worker caches only four public resources: the standalone offline HTML, its CSS/JS and one public icon. API requests, private photos, avatars, sessions, user data, application HTML and application JavaScript are never placed in Cache Storage. Failed navigation receives a localized reconnect screen. Requests to the API always use the network; uploads and votes are never queued, replayed, or marked successful while offline. An already-open app shows a connection notice. Server receipt times remain authoritative.

Normal navigation remains network-first without an app-shell cache, so it does not pin users to stale application bundles. The service-worker script is served with revalidation/no-store headers, registered with updateViaCache none, and checked when the app becomes visible. New workers can activate immediately because they do not swap cached application bundles. Bump the `stakeup-public-offline-v1` cache version whenever offline-screen resources change. Activation removes only old StakeUp offline caches, leaving unrelated origin data alone. Private HTTP responses retain the API's existing no-store behavior.

## Review inbox rules

`/app/reviews` is accessible through desktop navigation, the top bar, the mobile Reviews tab and a visible Home entry. `/api/reviews` requires authentication and validates filters, page sizes and paired cursor fields. The production adapter calls `stakeup_review_inbox`; the local adapter applies the same eligibility rules.

An item must be a received photo in an active challenge, with status ai_reviewed or disputed. The viewer must currently belong to its Circle, have accepted participation in the challenge, be someone other than the author, and have no vote in the current review round. Non-members, former members, unaccepted participants, own proof, unfinished uploads, decided proof and completed challenges are excluded. A vote in round zero does not hide a fresh disputed round. Counts describe eligible tasks across the full queue; All/Awaiting review/Disputes filters and 20-item keyset pagination use `(received_at, id)` for deterministic oldest-first ordering, including timestamp ties.

Photos load only after the viewer opens a task. The page reuses the existing private-photo, explanation, endorsement/rejection, history, appeal and conversation components. Actions still call the existing evidence API/RPC, which rechecks enrollment, ownership, challenge state, duplicate votes and quorum. An inbox item is not authority to bypass those checks. Visibility/manual refresh keeps an open explanation draft when its task remains eligible. A successful vote refreshes the queue; stale decisions return the existing server error rather than silently overriding another reviewer.

## Migration

Apply only `supabase/migrations/20261111000300_review_inbox.sql` after the existing profile/grace migrations. It adds a partial review index and an authenticated-only, empty-search-path RPC with explicit membership/enrollment guards. It neither changes existing evidence decisions nor modifies accepted rules or ledger entries. CI includes this migration and `supabase/tests/review_inbox.sql`.

The migration was submitted through the existing production project's SQL Editor on 2026-11-11. A subsequent anonymous PostgREST probe returned 42501 permission denied for the new function, confirming the transaction committed and the function is not anonymously executable. Browser control disconnected before the final editor result could be captured; the migration was not retried.

## Verification

TypeScript, 38 unit/API tests, frontend/API builds and the production API bundle HTTP check pass. All eight PostgreSQL suites pass in isolated PostgreSQL 17; the new suite exercises outsider/former-member/non-participant denial, paired filters/cursors, timestamp ties, fresh dispute rounds, removal after voting, retained quorum and completed-challenge exclusion. Browser installation tests verify manifest/icon dimensions, simulated prompt acceptance/dismissal, public-only caches, network failure for API requests, Russian offline fallback and online recovery. Three-person browser flows exercise real local photo uploads, direct inbox rejection, appeal and two-peer resolution. These fixtures never alter real user proof.

Native installation dialogs and real iOS/Android safe-area/camera behavior still need physical-device testing. Push notifications, background photo upload, account deletion, paid vision and signed native store packages are not part of this milestone.

The final full browser suite passes all 16 desktop/mobile journeys. Forty-eight landing/install combinations also pass across EN/RU, dark/light, orange/lime and 1440/390/320px widths. Chromium reports no installability errors on the connected local preview. The review draft refresh assertion uses the accessible textbox role because nested controlled textarea content changes exact label text matching; the draft itself remains intact.
