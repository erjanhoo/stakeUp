# Deployment and connected development

## Current public preview

- Website: https://stakeup-olive.vercel.app
- Fastify API: https://stakeup-api.vercel.app (routes live under `/api`)
- Vercel workspace: `erjanhoos-projects` / `team_WNjO70r5HtaPEdA6K6bMIdvO`
- Web project: `stakeup` / `prj_aSTf4Qjk10x1wiSc3etMGXGkbqwk`
- API project: `stakeup-api` / `prj_eQG65mLRJ5wJTof5TipVqDCDew7V`
- Supabase project: `bwtpxrjcubvvsvnsjigm`, Tokyo region, Free plan.

Foundation and social migrations are applied. The user set the live password minimum to 8 and verified real signup confirmation, Circle creation and invitation joining. Both Vercel projects are connected to GitHub and production tracks erjanhoo/social-challenges. Public health/config/auth routing checks passed for commit 1373003.

## Evidence release

The user applied 20261110000100_evidence.sql through the Supabase SQL Editor on 2026-11-10 and reported Success. It adds a private bucket, submission/vote/event tables and authenticated RPCs. Local PostgreSQL checks pass with minimal Auth/Storage metadata fixtures. Deploy API before web; verify the managed Storage service after deployment. No service-role secret or paid AI API key is required. The mock is explicitly labeled and always requests peer review.

Never rerun this CREATE migration or the earlier ones. For CLI deployment, reconcile the manually applied migration history first. Do not run the plain PostgreSQL bootstrap in Supabase.

Custom SMTP has not been configured by this work, but the user confirmed delivery to multiple accounts including a friend. It is not a current blocker. Monitor limits and delivery as usage grows; keep email confirmation enabled.

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
