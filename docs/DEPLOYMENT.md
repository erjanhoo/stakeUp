# Deployment and connected development

## Current public preview

- Website: https://stakeup-olive.vercel.app
- Fastify API: https://stakeup-api.vercel.app (routes live under `/api`)
- Vercel workspace: `erjanhoos-projects` / `team_WNjO70r5HtaPEdA6K6bMIdvO`
- Web project: `stakeup` / `prj_aSTf4Qjk10x1wiSc3etMGXGkbqwk`
- API project: `stakeup-api` / `prj_eQG65mLRJ5wJTof5TipVqDCDew7V`
- Supabase project: `bwtpxrjcubvvsvnsjigm`, Tokyo region, Free plan.

The foundation migration was applied to this new project through the Supabase SQL editor. The transactional two-user authorization test in `supabase/tests/foundation.sql` completed without errors; test fixtures were rolled back. Site URL and exact onboarding/password-reset callback URLs point to the public web origin. Email confirmation stays enabled. The live minimum password length is still 12 and secure password change is enabled. The application in this branch now requires 8; the Auth setting must be changed during the next release.

## Pending milestone 2 release

The new code is locally tested but not deployed. Computer Use stopped because it could not reliably determine the current browser URL on Windows; no further browser actions were attempted. The remote schema and password setting were left unchanged, and the earlier foundation stays online.

Release in this order, once Supabase access is restored:

1. Check the target project reference above. Reconcile the manually applied foundation migration history before using CLI migration push; do not rerun its CREATE statements. Apply only `20261109173728_social_challenges.sql` to the existing project. It is additive and compatible with the running foundation.
2. Run both transactional authorization scripts on a disposable/staging project first. The migration and scripts already pass on local PostgreSQL 17 with real roles/RLS; staging must also verify Supabase Auth and PostgREST.
3. Set Authentication's minimum password length to **8**. Keep email confirmation and secure password change enabled. Configure custom SMTP before opening public registration; do not disable confirmation to work around delivery.
4. Deploy the API source with its current environment and verify health/configuration/401 responses. Then deploy the web source. Both projects require the shared workspace contracts; pushing Git alone does not deploy under the current integration.
5. Verify with two authorized real accounts: confirmation → onboarding → invitation → challenge proposal → explicit acceptance → activation → frozen schedule; save all appearance combinations and reload. Check email recovery and a new eight-character password. Do not send synthetic signup emails to third parties.

If deployment fails after the migration, the earlier foundation remains compatible with the additive tables/columns. Roll back the application deployment rather than deleting accepted challenge data.

**Email launch limitation:** custom SMTP is not configured. Supabase's default email service is restricted and is not suitable for general public registration. Configure a production email provider in Supabase Authentication → Emails → SMTP Settings before inviting friends to create accounts. Email confirmation and end-to-end recovery delivery have not been verified. The public landing, auth screens, API and database are deployed; unrestricted email signup is not ready.

**Git deployment limitation:** the current Vercel GitHub integration could not access `erjanhoo/stakeUp`. These releases were uploaded from the checked-out repository using Vercel's source-file deployment API. Changes are committed to GitHub, but a Git push does not currently trigger a Vercel deployment. Connect the repository in each Vercel project's Git settings to enable that workflow. Keep its production branch aligned with the intended branch.

## Vercel configuration

Both projects use Node 24 and include workspace files outside their Root Directory. Only public Supabase keys are used. No service-role key is needed by the API or frontend.

| Setting        | Web                    | API                                                  |
| -------------- | ---------------------- | ---------------------------------------------------- |
| Root Directory | `apps/web`             | `apps/api`                                           |
| Framework      | Vite                   | Other / standard Node function                       |
| Install        | `npm ci`               | `npm ci --include=dev`                               |
| Build          | `npm run build`        | `npm run build:vercel`                               |
| Output         | `dist`                 | `public` (empty static directory) plus Node function |
| Configuration  | `apps/web/vercel.json` | `apps/api/vercel.json`                               |

The web configuration proxies `/api` to the API project before applying the SPA fallback. Its CSP allows only this Supabase project's connection endpoint. Browser security headers and HTTPS are enabled. No Vercel login is required to open the public URLs.

`apps/api/api/index.mjs` is a tiny Vercel entrypoint. The API build bundles internal TypeScript and shared contracts into `.build/serverless.mjs`, leaving installed third-party dependencies external. This avoids Vercel's workspace TypeScript tracing issue. The function forwards requests to the same Fastify application used locally, without starting an HTTP listener. `npm run test:bundle -w @stakeup/api` exercises the exact built artifact over HTTP and is included in `npm run check`.

API runtime variables: `AUTH_MODE=supabase`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `APP_ORIGIN=https://stakeup-olive.vercel.app`. Web build variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Keys are configured in Vercel, not committed. Changing frontend variables requires a new build. Local auth remains forbidden in production and whenever `VERCEL` is present.

## Connected local development

Set the following in an ignored root `.env`, using your project's **publishable** key (never a secret/service-role key):

```dotenv
AUTH_MODE=supabase
APP_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
```

Add exact localhost onboarding/reset callback URLs in Supabase only when needed for connected development. Local-development accounts do not migrate to Supabase. For isolated tests, continue using the loopback local adapter or a separate staging project. Never run synthetic signup/email tests against production recipients.

## Migrations and future releases

The existing project already has `202611090001_foundation.sql`; do not run that CREATE migration a second time. Because it was applied in the dashboard, reconcile its applied version with Supabase CLI migration history before the first automated migration push. Use the installed CLI's help to select the correct project/remote and migration repair commands; Supabase CLI v3 changed targeting defaults.

For a new project, apply the SQL migration first, run the authorization script against a disposable environment, configure Auth callbacks and SMTP, and set the environment variables above. The profile table remains owner-only until circle-scoped policies are implemented. All subsequent exposed tables must have explicit grants and RLS. Private storage and cron processing are deferred to their respective milestones.

Relevant provider documentation: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Vite deployment](https://vercel.com/docs/frameworks/frontend/vite), [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
