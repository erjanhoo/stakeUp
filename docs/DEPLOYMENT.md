# Connected development and deployment

## Supabase

No Supabase project credentials were supplied during foundation implementation. Production configuration is implemented but has not been exercised against a real project. Do not treat the local adapter as production authentication.

1. Create a Supabase project in the region appropriate for your users. Use separate staging and production projects.
2. Apply `supabase/migrations/202611090001_foundation.sql` through the Supabase SQL editor, or use your installed Supabase CLI (`supabase link --project-ref <ref>` then `supabase db push`). Apply only to the intended project. The migration creates `profiles`, `audit_events`, signup/profile triggers, grants, and self-only RLS.
3. Enable email/password authentication. Set minimum password length to 12. Configure email confirmation and production SMTP. In Auth URL configuration set Site URL to the web app origin and allow the exact `/onboarding` and `/reset-password` callback URLs. Add localhost equivalents for connected development.
4. Use the project's public publishable key (legacy anon key also works). Never use a service-role or `sb_secret_` key. User tokens are verified with `auth.getUser`; each API query forwards that user's token and is constrained by RLS.
5. Set these root `.env` variables for connected development, then restart both servers:

```dotenv
AUTH_MODE=supabase
APP_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
```

Only the two `VITE_` variables enter the browser bundle. The frontend and API must use the same auth mode and Supabase project. Existing local accounts do not migrate to Supabase. Invalid metadata usernames are replaced with a safe generated identity; duplicate requested usernames cause registration to fail rather than share identities.

6. Against a disposable migrated project, run the transactional authorization script with `psql <connection-string> -v ON_ERROR_STOP=1 -f supabase/tests/foundation.sql`. Prefer a protected environment variable/connection service over embedding a password in shell history. It creates two temporary auth users and rolls everything back. Test real confirmation, login, recovery and logout through the browser too.

RLS currently exposes each profile only to its owner. A later circle-specific policy will allow member-visible profile fields; never make the entire profiles table public. Storage buckets and upload policies are intentionally deferred until validated uploads ship.

## Vercel-compatible layout

Use two projects connected to the same repository. Enable access to workspace files outside each Root Directory so `@stakeup/contracts` resolves. Pin Node 24 in project settings. The repository has no Vercel project link and has not been deployed.

| Setting        | Web                                        | API                                            |
| -------------- | ------------------------------------------ | ---------------------------------------------- |
| Root Directory | `apps/web`                                 | `apps/api`                                     |
| Framework      | Vite                                       | Fastify (native detection)                     |
| Install        | npm workspace install from repository root | same                                           |
| Build          | `npm run build` (app workspace)            | native Fastify build (or app TypeScript build) |
| Output         | `dist`                                     | native Node function                           |
| Entrypoint     | `index.html`                               | `src/index.ts`                                 |

API runtime variables: `AUTH_MODE=supabase`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `APP_ORIGIN=https://YOUR_WEB_DOMAIN`. Web build variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Local mode is forbidden whenever `VERCEL` is present. `APP_ORIGIN` must exactly match the browser origin, without a trailing slash. Use environment-specific values for staging.

Before deploying the web project, copy `docs/vercel.web.example.json` to `apps/web/vercel.json` and replace the example API and Supabase hostnames with your own. The API rewrite must precede the SPA fallback. It preserves `/api/...` paths and avoids cross-origin cookies/CORS. The template includes browser security headers; its CSP explicitly permits the configured Supabase Auth endpoint. Future upload/vision integrations must extend only the necessary directives. Do not configure the API origin as APP_ORIGIN: the browser runs at the web origin.

The API uses [Vercel native Fastify support](https://vercel.com/docs/frameworks/backend/fastify). The SPA fallback follows [Vercel's Vite guidance](https://vercel.com/docs/frameworks/frontend/vite). Password flows follow [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords).

Before public release: run database authorization tests, test real SMTP callbacks, inspect the emitted bundle for secrets, verify HTTPS/CSP and same-origin API routing, and confirm the intended Supabase project and web domain. In-memory API rate limits are per instance; configure platform-level rate limits before public rollout. Supabase Auth also supplies its own authentication rate limits.

Phase 1 adds no cron jobs. Phase 4 will add authenticated bounded scheduled handlers and idempotent transactional database functions. No payment provider should be configured.
