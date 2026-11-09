# Verification and remaining work

## Local milestone 2 checkpoint — 2026-11-10

- `npm run check`: strict TypeScript, 17 contract/API/client tests, Vite production build, Fastify build and HTTP verification of the bundled Vercel handler pass.
- Six desktop/mobile Chromium journeys cover registration/onboarding, profile persistence, logout/login, recovery, two accounts joining a private Circle, explicit acceptance, activation, active-member leave restrictions, all four appearance combinations and persisted settings after reload.
- Screenshots reviewed for active challenge and Settings, including light/electric lime and dark/orange. Browser tests check horizontal overflow and uncaught errors. Chromium touch emulation covers 390px; it is not physical iPhone/Safari or assistive-technology testing.
- Both migrations applied successfully to fresh local PostgreSQL 17 with minimal Supabase Auth role fixtures. Foundation and social authorization scripts pass using real authenticated/anon roles and roll back all synthetic accounts. They test grants, outsider privacy, invitation expiry/idempotency, immutable reward/rule snapshots, ownership, atomic activation, schedule uniqueness, account appearance and DST agreement.
- SQL/database checks are included in GitHub Actions alongside TypeScript/build/API/browser checks. The updated CI workflow itself has not yet run remotely.

An initial browser test expected a manual profile link after signup; onboarding is automatic. Authentication now chooses its destination from the freshly loaded profile, keeping invitation continuation deterministic. A later mobile run was interrupted by development hot reload while shared contracts were being edited; final checks use unchanged application sources.

## Public foundation checkpoint

The public foundation remains at [stakeup-olive.vercel.app](https://stakeup-olive.vercel.app). Its original external verification is recorded in [PUBLIC_PREVIEW.md](PUBLIC_PREVIEW.md): Vercel READY, public landing/auth/deep links, same-origin API health/configuration, unauthenticated authorization and disabled local recovery. Foundation RLS was also checked in the connected Supabase project.

Milestone 2, themes and the eight-character policy are **not deployed**. Computer Use stopped because it could not verify the current browser URL on Windows. No subsequent browser actions were attempted. The remote migration and Auth minimum were not changed; the existing foundation stays online. See DEPLOYMENT.md for the coordinated release sequence.

## Still unverified or deferred

- Managed Supabase/PostgREST integration for milestone 2, a successful real-user signup/confirmation/login/onboarding/invitation journey, actual recovery email delivery and production theme persistence.
- Custom SMTP is missing; default Supabase mail is unsuitable for unrestricted public signup. Live minimum remains 12 until changed to 8 in Auth settings.
- Evidence/private uploads, avatars, AI/peer review/disputes, virtual ledger/penalties/rewards, leaderboard, notifications and social reactions remain later milestones. Schedule creation is working; automatic deadline processing is not yet implemented.
- Active challenge settlement, ownership transfer, account deletion/retention, physical devices, Safari and a broader accessibility audit remain required before general launch.
- Local JSON persistence remains single-process and loopback-only. Process-local API rate limiting needs platform-wide controls and monitoring for public production use.

Local test accounts, screenshots and traces live under ignored `.local` and `test-results` directories. Do not treat them as real production activity or commit them.
