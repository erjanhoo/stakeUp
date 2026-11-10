# Stitch redesign — structural rebuild

Branch: `erjanhoo/stitch-redesign`. The production branch is unchanged. This build is for design review before promotion.

## Reference and scope

The user supplied 40 exports: 20 paired mobile and desktop designs. The HTML, screenshots and Obsidian Kinetic design document are the visual specification. This implementation replaces the former page compositions instead of relying on a font/palette overlay. One connected responsive React route implements each mobile/desktop pair.

| Export | Route | Implemented composition |
| --- | --- | --- |
| 01 Landing | `/` | Wide split hero, virtual-credit panel, original exported editorial image, five-step cards, illustrative Circles beside FAQ, compact CTA |
| 02–05 Authentication | `/register`, `/login`, `/forgot-password`, `/reset-password` | Split registration/login cards, privacy/process rail, compact mobile form, centered recovery states |
| 06 Onboarding | `/onboarding` | Monogram/guardrail rail and identity form; stacked phone layout |
| 07 Invitation | `/join` | Invitation introduction, privacy/process panels and authenticated join form |
| 08 Overview | `/app` | Obligations column plus pool/milestones rail; pool comes first on phones |
| 09 My Circles | `/app/circles` | Unified hero/metrics band, active/archive filters, original desktop illustrated covers and image-free mobile cards containing current challenge and roster |
| 10 Create Circle | `/app/circles/new` | Identity form, working icon picker, live Circle preview and owner-policy rail |
| 11 Circle | `/app/circles/:id` | Challenge filters/cards, explicit acceptance roster, invitation banner, member/activity rail |
| 12 Proposal | `/app/circles/:id/challenges/new` | Four numbered form sections and sticky live proposal preview/publish rail |
| 13 Challenge | `/app/challenges/:id` | Participant scorecard/actions, immutable rules, roster; single column on phones |
| 14 Evidence | `/app/challenges/:id/evidence` | Submit/review/grace tabs; obligation card and photo composer beside peer review; keyboard-operable tabs |
| 15 Competition | `/app/challenges/:id/competition` | Pool/lifecycle split, full-width standings, ledger and deterministic-rules rail, settled results |
| 16 Personal activity | `/app/activity` | Search/filter toolbar, chronological event cards and actual progress/privacy rail |
| 17 Notifications | `/app/notifications` | Filtered private inbox beside notification policy, real mark-read actions |
| 18 Settings | `/app/settings` | Identity/profile/security column and appearance preview/language column |
| 19 Roadmap | `/app/roadmap` | Working capabilities and planned capabilities in separate desktop columns |
| 20 Utility states | Unknown routes and error boundaries | Centered error/recovery card, consistent icon/state treatment, working recovery navigation |

## Connected behavior

All forms use existing APIs and schemas. Camera/gallery selection, image preparation, private upload, review quorum, appeal, grace selection/cancellation, acceptance/activation, ledger and settlement behavior are preserved. No backend or database migration is needed. Account appearance and Russian/English language remain persisted. Reduced-motion preferences and browser zoom remain supported.

The original exported editorial images are stored in `apps/web/public/images`; photographs used as illustrative marketing art never represent real users' evidence. Fonts remain local, with their SIL Open Font License notices. No Tailwind CDN, exported inline simulation scripts, third-party icon fonts or external runtime asset requests are used.

## Expected differences from static samples

Names, counts, dates, photos and states reflect the signed-in account. Empty, proposed, active, disputed and settled states have different content. Color/language preferences can also differ from the default lime screenshots.

Prototype-only widgets are mapped to truthful copy/data in the same visual regions: there is no blockchain, E2EE claim, hardware attestation, public live Circle feed, entry stake, spendable starter grant, weighted voting, owner arbitration, multiple evidence attachment, device/session management or offline proof queue. The AI mock checks file readability only. Peer review remains authoritative. Grace reservations use the accepted server deadline, not invented prototype cutoffs. All stakes remain virtual.

## Review preview

The connected local preview is `http://localhost:5183`, backed by the API on port 3003. Existing confirmed Supabase accounts can sign in. Preference changes and other actions affect the real account. Automated design/regression checks use separate local-auth data on ports 5173/3001; they do not mutate Supabase user records.

Both previews are temporary development processes. Production at `https://stakeup-olive.vercel.app` is not updated by this branch. A source push may trigger Vercel preview creation, but its API/origin configuration is separate from this working local review setup.

## Verification

- `npm run check` passes: TypeScript, all 33 automated tests, frontend/API builds, and the production API bundle HTTP authorization check.
- The complete desktop/mobile browser suite passes: 12 journeys covering registration/recovery, profile/preferences, two-account invitation/enrollment/activation, three-account photo rejection/appeal/resolution, private comments/reactions, chosen grace, notifications and exact virtual settlement.
- After fixing the generic invitation entry, all four foundation/recovery journeys pass again, including a new assertion that a signed-in user can open `/join` without a prefilled token.
- Forty route/viewport captures pass without browser errors or document overflow. Additional populated account, Circle, challenge and proof captures pass. Layout checks also pass at 320, 768 and 1024 pixels, and Cyrillic headings use an explicit sans-serif fallback.
- The connected Supabase-mode local preview renders the redesigned landing and generic invitation page without browser errors; no automated sign-in or live-user mutation was performed.

 Static screenshots are compared for layout, hierarchy, density and responsive ordering; fake sample data is not copied into the backend to manufacture identical pixels. Physical-device camera checks and live authenticated Supabase journeys remain operational checks. Phone/Windows installation and app-store packaging remain a separate milestone.
