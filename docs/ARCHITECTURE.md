# StakeUp architecture and product plan

## Repository inspection

The supplied GitHub repository and local checkout were empty on 2026-11-09. There are no existing application conventions, migrations, or user data to preserve. Work begins on `erjanhoo/foundation`.

## Proposed architecture

Keep the requested stack. Use an npm-workspaces monorepo with a React/TypeScript/Vite SPA, Tailwind and owned shadcn/ui primitives, React Router, Lucide, and Motion. A Fastify/TypeScript API owns application mutations and validation. A shared package contains Zod contracts. Supabase provides PostgreSQL, Auth, and private Storage in production. User-scoped API database clients forward the verified bearer token, preserving RLS; background workers will have a separate privileged boundary.

In development, an explicit local-only adapter supplies persistent accounts and expiring HttpOnly sessions. It is disabled under NODE_ENV=production or VERCEL, listens only on loopback, checks mutation origins, and never presents itself as Supabase. No credentials are required to exercise the foundation. The file adapter is single-process development infrastructure, not a deployable database. Passwords use Node scrypt with random salts; sessions store token hashes. Production passwords and resets belong exclusively to Supabase Auth.

Deploy the SPA and API as separate Vercel projects from this repository, proxying `/api` to the API project through a same-origin rewrite. The API uses a standard Vercel Node handler wrapping the same Fastify app tested locally. Internal TypeScript and shared contracts are bundled before function tracing; `src/index.ts` remains the local listening server. Do not persist local state in serverless filesystems. Durable scheduled work will operate through transactional PostgreSQL functions, not in-process timers.

## Initial project structure

```text
apps/web/                 React application, routes, UI, auth and API client
apps/api/                 Fastify app, adapters, configuration, API tests
packages/contracts/      Shared validation and transport types
supabase/migrations/     Versioned production schema and RLS
supabase/tests/          Database authorization tests
docs/                    Architecture, domain rules and operational instructions
tests/e2e/               Browser flow tests
```

Avoid separate microservices, a queue, an ORM, and a state framework until a vertical slice needs them. API error envelopes contain a safe message and request ID. Never log credentials, authorization headers, passwords, or full request bodies.

## Database schema proposal

Foundation and phase-2 tables are implemented in versioned migrations; remaining entities arrive with their owning milestone. UUID primary keys; UTC `timestamptz` audit fields; constrained enums/checks; indexed foreign keys. Preserve local civil dates separately from UTC instants. Phase 2 stores immutable, validated challenge policies as versioned JSON snapshots inside the relational challenge entity, avoiding parallel mutable copies of accepted rules. See SOCIAL_CHALLENGES.md for current invariants.

| Entity                                 | Key fields and invariants                                                                                                                                                                                 | Phase |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| profiles                               | auth.users ID, unique lowercase username, display name, timezone, avatar URL, onboarding timestamp                                                                                                        | 1     |
| audit_events                           | actor, event kind, resource ID, server timestamp; append-only and owner-readable                                                                                                                          | 1     |
| circles                                | creator, name, description, private avatar path                                                                                                                                                           | 2     |
| memberships                            | circle + user unique, owner/admin/member role, joined/left timestamps                                                                                                                                     | 2     |
| invitations                            | circle, hashed high-entropy token, expiry, usage cap; redeem atomically                                                                                                                                   | 2     |
| challenges                             | circle, creator, status, immutable active rules version, title, local date range, IANA timezone, weekday mask, local cutoff, evidence policy, penalty/cap minor units, grace count, reward policy version | 2     |
| challenge_participants                 | challenge + user unique, enrollment status, enrolled/left timestamps                                                                                                                                      | 2     |
| rule_acceptances                       | participant + rules version unique, canonical rules hash, accepted_at                                                                                                                                     | 2     |
| daily_obligations                      | participant + local date unique, resolved UTC deadline, outcome, grace allocation                                                                                                                         | 2–3   |
| evidence_submissions                   | obligation, owner, private object path, server received_at, SHA-256, status, revision                                                                                                                     | 3     |
| ai_reviews                             | submission, provider/model/policy version, observations, unverified claims, confidence, recommendation                                                                                                    | 3     |
| disputes / review_votes                | submission, reason, resolution, immutable eligible voters, unique voter per dispute, no self-vote                                                                                                         | 3     |
| ledger_transactions / ledger_entries   | unique idempotency key/reason, challenge, balanced integer debits and credits; no client writes                                                                                                           | 4     |
| reward_distributions                   | challenge + formula version unique, committed pool snapshot, allocations and audit record                                                                                                                 | 4     |
| notifications                          | recipient, event key unique, type, payload, read_at                                                                                                                                                       | 5     |
| activity_events / comments / reactions | circle-scoped membership access, author, server timestamps, target reference                                                                                                                              | 5     |

Future circle access uses a hardened membership helper to avoid recursive RLS. Private buckets reject anonymous reads; evidence access requires circle membership and a short-lived signed URL. Financial RPCs are inaccessible to normal clients. A transaction locks challenge/participant rows before allocating a penalty or final reward. Unique business keys prevent duplicate scheduler effects. No future table should be exposed until its authorization policies and tests exist.

## MVP boundaries

The full MVP is private circles, accepted and locked daily challenge rules, private proof, cautious AI-assisted plus quorum peer review, virtual penalties, deterministic rewards, and in-app notifications. All value is virtual; there are no deposits, payouts, cards, bank details, or payment SDKs.

**Foundation acceptance:** registration, login, logout, session restoration, protected API and routes, onboarding, profile/timezone editing, Supabase password recovery, persistent local development alternative, a responsive home/dashboard, useful empty/error/loading states, foundation migration/RLS, automated checks, and setup documentation. New accounts start with zero activity. No seeded statistics appear as live user data.

**Social-challenge acceptance:** two distinct accounts join a private Circle through an expiring invitation, propose and accept identical immutable rules, and activate a fixed UTC schedule. Roles, privacy, enrollment locks, DST and appearance persistence have automated checks. This milestone is implemented locally and awaits a coordinated database/API/web release.

**Deferred explicitly:** camera/storage uploads including profile and Circle photos, AI requests, disputes, ledger mutations, rankings, social reactions/comments, recaps, achievements, and notifications. Circle membership/challenge events are already recorded. Future-feature screens must identify their milestone. Do not ship arbitrary sample challenges as a user's own.

## UI/UX direction

Default dark graphite canvas with warm off-white text; optional warm light canvas. Appearance and accent are independent Settings choices: orange or electric lime works in either mode. Preferences persist per account and cache locally for first paint. Use large editorial headings, fine borders, small uppercase labels, generous spacing, and a distinctive circular accountability motif. Desktop has a compact rail/sidebar; phones have a four-item bottom navigation. The home screen prioritizes today's commitments, then circle context and momentum. Honest empty states guide the next action; future actions identify their milestone. Respect reduced motion, visible focus, contrast, keyboard navigation, explicit labels, and touch targets.

## Phased roadmap

1. **Foundation (deployed):** workspace, design tokens and primitives, local/Supabase auth adapters, onboarding/profile, server authorization, live account dashboard, migration, CI and deployment instructions.
2. **Social challenges:** circle CRUD, role rules, invite redemption, immutable challenge configuration and participant acceptance, local-date obligation generation and DST tests. Exit: two accounts join a private circle and accept the same rules.
3. **Evidence:** private signed uploads with byte-signature/size checks, server receipt time, history, verification-provider abstraction and honest mock, cautiously scoped vision integration, dispute quorum/history. Exit: upload → review → resolution works across members with privacy tests.
4. **Competition:** transactional deadline processing, caps/grace, balanced virtual ledger, standings and reward settlement. Exit: retries and concurrency cannot double-charge; settlement conserves every minor unit.
5. **Polish:** in-app notification outbox, comments/reactions, accessible celebrations, monthly recaps, device testing, operational monitoring, staging security review and deployment.

Each milestone runs TypeScript, relevant domain/API/database/browser tests, records unfinished work, and commits a reviewable slice.

## Security and technical risks

- Auth and RLS must agree. Never use a service-role key to bypass membership checks in normal API handlers. Test direct database calls as well as HTTP.
- SPA bearer tokens are exposed to XSS; maintain a restrictive CSP, render text safely, avoid arbitrary HTML, and isolate third-party scripts. Local cookies are HttpOnly and same-site; Origin validation protects mutations.
- DST uses the later instant for an overlap and shifts a skipped time forward by the clock-change gap (02:30 becomes 03:30 for a one-hour jump). Temporal and PostgreSQL `AT TIME ZONE` agree in transition tests. Freeze deadlines at activation; future timezone database updates do not rewrite them.
- Photos establish observations, not completion or capture time. Server receipt time proves only submission time. Duplicate hashes are signals, not proof of fraud. Never finalize disputed penalties while review is unresolved.
- Peer collusion remains possible. Use a minimum two non-owner reviewers and strict majority; ties or insufficient quorum remain unresolved. Larger circles and moderator policies may be needed before launch.
- Local persistence is deliberately not multi-process safe or a production auth substitute. Supabase email delivery, callback allowlists, migrations and RLS must be configured and tested against a real project before release.
- Upload retention, account deletion and jurisdiction-specific consumer/privacy obligations need decisions before public launch. Virtual-only accounting is a firm constraint.
- Vercel cron retries, overlapping executions and time limits demand idempotent database transactions and bounded batches. Verify the deployment plan's schedule support in phase 4.
