# Foundation verification

Story: a person visits the landing page, creates a persistent account, completes onboarding, sees their own account dashboard, saves profile/timezone changes, signs out, signs in again and can recover a forgotten password.

## Verified locally on 2026-11-09

- Strict TypeScript check across frontend, API, shared contracts and browser tests.
- Thirteen contract/API/client tests: unauthenticated access, rejected cross-origin mutations, private account/dashboard data, persistent session restoration, hashed passwords/session tokens, concurrent duplicate registration, validated profile/timezone updates, identity-field tampering, onboarding audit events, incorrect passwords, logout revocation, single-use recovery and revoked sessions, local routes disabled in Supabase mode, production configuration rejection, malformed API routing responses and session-expiry status propagation.
- Vite production build and Fastify TypeScript build.
- Four Chromium browser journeys, desktop (1440 px) and mobile (390 px with touch emulation): landing → registration → onboarding → dashboard → reload → profile persistence → logout → login; forgotten-password → local mailbox → reset → login.
- Screenshots of the landing and dashboard reviewed at both sizes; horizontal overflow assertions passed. Browser journeys recorded no uncaught page errors. Reduced-motion handling and keyboard focus styles are present.
- npm installation audit reported zero known vulnerabilities at installation time. Versions are locked; this is not a substitute for ongoing dependency monitoring.

Browser tests initially found ambiguous field names because helper text and the password visibility button were included in implicit labels. Inputs now have explicit accessible names/descriptions. Mobile settings exposes password recovery and logout without relying on the desktop sidebar.

## Not verified / intentionally unfinished

- **Real Supabase:** no configured project, credentials or SMTP service. Migration and RLS test script exist but were not executed against PostgreSQL. Docker CLI is present, but its engine is not running; no local PostgreSQL server was available. Connected registration, confirmation links, recovery links, RLS and persistence must be tested against a disposable project before release.
- **Deployment:** Vercel-compatible entrypoint and configuration template are provided. Projects, API rewrite host, Supabase host, HTTPS origin and callback allowlists still require configuration. No live deployment was made.
- **Device coverage:** Chromium mobile emulation, not a physical iPhone or Safari test. Assistive-technology and broader browser audits remain before public launch.
- **Later milestones:** circles, invitations, challenge rules/enrollment, obligations/deadlines, photos including avatars, AI/peer reviews, disputes, ledger/penalties/rewards, rankings, social features and notifications. Their visible screens are honest empty states or roadmap notices, without simulated user achievements.
- **Operational limits:** development JSON persistence is single-process only; serverless persistence requires Supabase. Rate limiting is per Fastify process; public production deployment needs platform limits and monitoring.

Use `npm run check` and `npm run test:e2e` to reproduce the local checks. Use `supabase/tests/foundation.sql` and the deployment guide for external checks. E2E traces/screenshots and local account data are ignored by Git.
