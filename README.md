# StakeUp

**Show up. Together.** Private social accountability with friendly, entirely virtual stakes.

The repository includes foundation, social challenges, evidence, competition and community features: authentication, onboarding, profiles, saved dark/light appearance with orange/electric-lime accents, private Circles, expiring invitations, challenge proposals, explicit rule acceptance and locked timezone-aware schedules. Dashboard counts come from actual memberships and enrollment. Private proof uploads, an honest mock review provider, peer decisions and disputes are implemented in milestone 3; configurable upload windows and virtual competition are now deployed. Russian/English settings, chosen grace days on new challenges, in-app notifications, proof conversations/reactions, achievements and monthly recaps are implemented. No real payments exist.

Public preview: **https://stakeup-olive.vercel.app**. Foundation and social challenges are live; the user has verified signup emails, Circle creation and invitation joining. Milestone 3 and the animated landing-page redesign are now deployed. The evidence migration is applied, and API/web public checks pass. SMTP is not a current blocker for these verified users; revisit delivery limits as usage grows.

## Run locally

Use Node 22.12+ (Node 24 LTS recommended) and npm. From the repository root:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:5173** (use `localhost`, not `127.0.0.1`, because mutation origins are checked). The API binds to `127.0.0.1:3001`; Vite proxies `/api`. Create an account with a password of at least 8 characters. There are no shared/default credentials.

Local accounts persist in ignored `.local/stakeup.json`. This file contains password hashes, email addresses, profiles and hashed sessions; treat it as private. Local mode is single-process, loopback-only development infrastructure. It is rejected in production and on Vercel. The password-recovery screen provides a clearly labeled local mailbox link instead of sending email. Browser tests use a separate ignored `.local/e2e-*.json` store. Remove only those files when you no longer need test accounts.

Stop development with Ctrl+C. No paid service is needed for this mode.

## Architecture and planning

- [Architecture, project structure, schema proposal, scope, design, roadmap and risks](docs/ARCHITECTURE.md)
- [Proposed virtual reward rules](docs/REWARD_RULES.md)
- [Supabase and Vercel setup](docs/DEPLOYMENT.md)
- [Foundation verification and known limitations](docs/VERIFICATION.md)
- [Upload windows and virtual competition](docs/COMPETITION.md)
- [Community, Russian localization and chosen grace days](docs/COMMUNITY.md)
- [Google Stitch redesign brief with exact pages, actions and permissions](docs/STITCH_DESIGN_BRIEF.md)
- [Evidence, review rules and upload security](docs/EVIDENCE.md)
- [Social challenges: rules, boundaries and acceptance checks](docs/SOCIAL_CHALLENGES.md)

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

`check` runs TypeScript, contract/API tests, both builds and an HTTP check of the exact production API bundle. Browser tests manage their own servers on 5173/3001; stop an existing development server before running them. They cover account/recovery flows, two friends joining a Circle and activating accepted rules, and all four appearance combinations on desktop and mobile. CI also runs migrations and authorization tests against disposable PostgreSQL.

## Next milestone

Community features and localization are deployed; see docs/COMMUNITY.md for release verification and limitations. Next is launch hardening: real-device camera checks, live scheduled-job monitoring, retention/account deletion, pagination and abuse controls. Paid vision and push remain separate integrations.
