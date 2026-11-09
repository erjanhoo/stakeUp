# Public preview verification — 2026-11-09

URL: https://stakeup-olive.vercel.app

The web and API Vercel deployments reached READY, and public HTTP/browser checks verified:

- Desktop and mobile landing pages, no horizontal overflow.
- Registration screen and protected deep links redirecting to login.
- Real Supabase invalid-credential handling, without sending signup or recovery emails.
- Same-origin `/api/health` and `/api/config` return 200 with Supabase mode.
- `/api/me` returns 401 for missing and invalid bearer tokens.
- Local development recovery routes are disabled (404) in the public deployment.
- No uncaught browser errors in the public browser journey.
- Supabase foundation migration applied, exact callback URLs configured, and transactional two-user RLS/ownership/grant tests completed without errors. Fixtures rolled back.
- Local strict TypeScript, 13 automated tests, both builds, production bundle HTTP test and four desktop/mobile local browser journeys pass.

The initial native Fastify deployment produced no function. A standard Vercel Node handler is now used. Production logs then exposed a missing workspace TypeScript module; explicitly bundling internal modules and shared contracts resolved that issue. The exact production artifact is now tested as part of the standard check.

Unverified/remaining: custom SMTP and actual email confirmation/recovery delivery; a successful real-user Supabase signup/login/onboarding journey; physical devices/Safari; Supabase advisor review; automatic GitHub-triggered redeployment. See DEPLOYMENT.md for configuration and migration-history notes. This public foundation preview does not yet include circles/challenges or evidence/financial features.
