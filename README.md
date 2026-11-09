# StakeUp

**Show up. Together.** Private social accountability with friendly, entirely virtual stakes.

This is the first working foundation milestone, not the entire application. It contains a responsive landing page, registration/login/recovery, secure sessions, onboarding, editable profiles/timezones, a protected dashboard with actual account activity, settings, and clearly marked future-feature screens. New accounts have no fabricated challenge statistics. No real money or payment integration exists.

## Run locally

Use Node 22.12+ (Node 24 LTS recommended) and npm. From the repository root:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:5173** (use `localhost`, not `127.0.0.1`, because mutation origins are checked). The API binds to `127.0.0.1:3001`; Vite proxies `/api`. Create an account with a password of at least 12 characters. There are no shared/default credentials.

Local accounts persist in ignored `.local/stakeup.json`. This file contains password hashes, email addresses, profiles and hashed sessions; treat it as private. Local mode is single-process, loopback-only development infrastructure. It is rejected in production and on Vercel. The password-recovery screen provides a clearly labeled local mailbox link instead of sending email. Browser tests use a separate ignored `.local/e2e-*.json` store. Remove only those files when you no longer need test accounts.

Stop development with Ctrl+C. No paid service is needed for this mode.

## Architecture and planning

- [Architecture, project structure, schema proposal, scope, design, roadmap and risks](docs/ARCHITECTURE.md)
- [Proposed virtual reward rules](docs/REWARD_RULES.md)
- [Supabase and Vercel setup](docs/DEPLOYMENT.md)
- [Foundation verification and known limitations](docs/VERIFICATION.md)

```text
apps/web             React + Vite + Tailwind + shadcn-style owned UI primitives
apps/api             Fastify API + local/Supabase adapters
packages/contracts   Shared Zod input contracts and transport types
supabase             SQL migration and authorization tests
tests/e2e            Desktop/mobile browser journeys
```

Package versions are pinned in manifests and the npm lockfile. TypeScript is strict. Routes are split into lazy-loaded chunks. No service-role key is used by the application.

## Checks

```powershell
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` runs TypeScript, contract/API tests and both builds. Browser tests manage their own servers on 5173/3001; stop an existing development server before running them. They exercise registration → onboarding → dashboard → profile persistence → logout → login, and password recovery, at desktop and mobile sizes. CI runs these checks on pushes and pull requests.

## Next milestone

Private Circles, roles, expiring invitation redemption, challenge rule configuration, explicit enrollment and timezone-aware deadline generation. Evidence, AI, disputes, virtual ledgers, distributions, social features and notifications follow in later milestones. Profile photos ship with the secure upload pipeline in phase 3. See the architecture document for acceptance criteria and boundaries.
