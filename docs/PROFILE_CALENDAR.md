# Profiles, calendar and grace passes

## Product behavior

The approved Stitch interface is the only public design. English/Russian preferences and all four light/dark, orange/lime combinations remain. Russian Circle terminology is now «команда». Question-mark controls explain pools, challenges, proof review and the calendar in translucent popovers; Escape, outside-click and close controls dismiss them. Motion respects reduced-motion preferences. Select controls use themed native pickers where supported, with a styled accessible native fallback elsewhere.

The Circle calendar uses challenge-local calendar dates, not a client-provided proof timestamp. Colors show the signed-in participant's obligations: red for an expired day without a received photo or for rejected proof, green for a received photo or a selected grace pass. Green means submitted/excused, not necessarily peer-accepted. Counts include all teammates' received photos. Opening a date shows the day's challenge photos with the existing private-image, peer-vote, appeal, review history, reaction and conversation components. Empty dates have an explicit empty state.

An agreed `chosen_v1` grace pass bypasses one scheduled or missed obligation without a photo or review. It consumes the existing challenge allowance and is marked excused, rather than verified. Retrying cannot consume a second pass. Future passes can be cancelled before their deadline; past passes cannot be cancelled. Already received photos cannot be replaced by a pass. An active challenge's provisional penalties recompute; finalized ledger/distribution snapshots stay locked. Existing `automatic_v1` rules retain their agreed behavior. No additional grace is awarded without an agreed rule.

Clicking a participant avatar opens their profile. Profiles and photos require authentication plus current shared Circle membership, or self-access. Peers only see achievement counts from challenges they can access; email, timezone and account preferences are not returned. Uploaded JPEG/PNG/WebP avatars are center-cropped, normalized to a 256px JPEG, stripped of location metadata and stored privately. The API validates size, format and ownership; no service-role key or public bucket is used. Settings and the user's profile both offer photo upload.

Initial profile rewards are deterministic: 10 progress points per accepted photo and 50 per completed challenge with accepted participation. Badges unlock at 1, 7 and 30 accepted photos, plus challenge completion. These are total milestones, not consecutive-day streak claims. Points are derived from authorized server counts, have no cash value, and do not modify the virtual financial ledger. Grace passes do not count as accepted photos. A reversed review can change these derived progress totals. Other viewers see only shared-access progress, preserving Circle privacy.

## Database and release

After the existing community migration, apply `20261111000100_member_profiles.sql` and `20261111000200_grace_bypass.sql` once, in that order. The first adds the safe profile RPC and private avatar bucket/policies. The second guards the expected community RPC source before changing only the grace-selection deadline gate. The existing challenge row lock serializes pass consumption with settlement. Neither migration overwrites user evidence or settled transactions.

Both migrations were applied to the managed production project through its signed-in SQL Editor on 2026-11-11; the editor returned Success. No additional credentials or paid providers are required. Deploy API and web from the same tested commit to the existing production branch `erjanhoo/social-challenges`.

## Validation and limits

The full TypeScript/unit/API/build check passes, including 35 tests and the exact Vercel API bundle HTTP check. All seven PostgreSQL authorization suites pass in an isolated PostgreSQL 17 cluster. New checks cover membership-scoped profiles/avatars, forbidden peer overwrite, outsider denial, single-use missed-day passes, allowance limits and past cancellation. Browser checks cover desktop/mobile calendar navigation, pass consumption, actual avatar upload, private teammate profiles and the distinction between an excused day and an earned badge. Accepted-photo rewards and photo/review navigation are also exercised.

Physical iOS/Android camera behavior, real-account production upload/review/settlement walkthroughs, managed cron run monitoring, retention/account deletion, larger-history pagination, paid vision and push remain separate launch work. The AI development provider still checks decodability only and never attests completion. Profile/calendar browser tests use isolated local-auth fixtures, never live user records.
