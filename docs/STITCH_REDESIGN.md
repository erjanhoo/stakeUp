# Stitch redesign — review build

Branch: erjanhoo/stitch-redesign. This is an integrated responsive design pass for review, not a promotion to the live production branch.

The supplied 20 mobile/desktop pairs informed a shared Obsidian Kinetic theme: slate surfaces, tight corners, local Space Grotesk/Hanken Grotesk/JetBrains Mono fonts, lime/orange accent combinations, monospaced metadata and persistent mobile/desktop navigation. Shared styling reaches all existing routes. The landing composition is rebuilt; dashboard actions, proof section navigation and competition section navigation are updated. Mobile standings use participant cards with labeled values rather than horizontal table scrolling. Settings retain both language and appearance persistence.

The existing React forms, API calls, private uploads, quorum/dispute/grace policies, immutable rules and virtual settlement logic remain connected. No backend or database migration is part of this branch. Prototype-only blockchain/security claims, entry stakes, starter grants, GPS attestations, state simulators and fake live data were not imported. The export is a visual reference, not trusted application logic. Native device management, weighted votes, multiple proof attachments and offline submissions have not been added.

## Validation

- npm run check passes: strict TypeScript, 33 automated tests, both builds and the exact production API bundle HTTP check.
- Eleven of twelve desktop/mobile journeys passed in the first full run. The remaining theme-persistence test reloaded before awaiting the save; it now waits for the committed selection. Both desktop/mobile social journeys passed when rerun. Thus all twelve journey scenarios pass across the runs.
- A separate browser pass captured 39 route/viewport screens using real local accounts, Circles and proposals: no horizontal overflow or page errors. Populated proof/dispute and settled-result states are covered by the multi-account tests.
- After palette-specificity and Settings alignment refinements, the frontend production build passes again. Screenshot review covers landing, Settings, Circles, proposal form, proof and settled results at desktop/mobile sizes. Pixel-perfect parity with every screenshot is not claimed; unsupported prototype widgets and fictional sample data are intentionally absent.
- Fonts are bundled under public/fonts with their SIL Open Font License notices. No runtime Tailwind CDN, external icon font or Google-hosted proof assets are imported.

## Local review

A loopback web preview runs at http://localhost:5183, with its API on port 3003. It uses Supabase Authentication and existing production data, with only public publishable keys. Existing confirmed accounts can sign in; actions and preference saves affect the real account. No automated login or live-data mutation was performed during preview checks. Supabase email callbacks may return to the production URL according to the existing allowlist; use an existing confirmed account for review. The regular production website retains its current design.

An isolated local-auth test preview also runs on localhost:5173 with ignored .local/stitch-design-review.json data. It is separate from real accounts and was used only for route captures. Both previews are temporary development processes, not public hosting. Stop them when review is finished.

## Review checkpoint and remaining work

Review the new compositions and density before promoting UI changes to production. The core UI is adapted through shared components and layout styling, rather than forty independent static HTML pages. Further visual adjustments can be made against individual exported screens after feedback. Installable phone/Windows packaging remains the next separate step after design review; this branch does not yet add a PWA manifest, service worker, offline mode, native installers or app-store builds. Physical-device camera checks and live authenticated Supabase journeys remain operational verification work.
