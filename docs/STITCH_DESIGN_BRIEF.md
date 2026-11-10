# StakeUp — complete UI/UX redesign brief for Google Stitch

Redesign an EXISTING, functional app. This is a visual/interaction design task, not permission to invent a different product or change its backend rules. Produce connected, implementation-ready screens with every action and state described below. Preserve the routes and business behavior; completely rethink the visual presentation.

## Product and visual direction

StakeUp is a private social accountability app. Friends form Circles, agree to challenges, submit private photo evidence, review each other fairly and compete for strictly VIRTUAL credits. It should feel like a distinctive consumer brand: motivating, friendly, competitive and premium, without shame or casino imagery.

Create a complete visual redesign, not a recoloring of a generic SaaS dashboard. Use strong typography, purposeful shapes, editorial compositions, a recognizable visual motif and restrained, smooth motion. Avoid repetitive grids of identical rounded feature cards, excessive floating widgets, stock AI gradient blobs and decoration without a purpose. Prioritize today's next action over decorative statistics. Use compact rows, connected progress paths, timelines and meaningful whitespace where appropriate. Do not use the existing website's layout as a template.

Mobile-first at approximately 390px; provide coherent desktop layouts at approximately 1440px. Provide four theme combinations: dark/orange, dark/electric-lime, light/orange and light/electric-lime. Bright accent colors should visibly influence selected navigation, progress indicators, icons, outlines, focus rings and important actions, not just one button. Maintain readable contrast, particularly lime on light backgrounds. Use a piggy-bank icon consistently for the virtual pool.

Support English and Russian. Settings switches the language. Use real editable text and reusable components; allow Russian labels to wrap naturally. Keep user-written names, challenge titles, comments and notes unchanged. Dates and number formatting follow the language; challenge timezones remain explicit. Use initials for user avatars and selectable icons for Circles: photo-avatar editing is not implemented.

Motion should communicate transitions and feedback, approximately 150–300ms for controls and 300–500ms for page/celebration moments. Include reduced-motion behavior. Keep visible focus, labeled inputs, sufficiently large touch targets and keyboard-accessible menus/dialogs. Do not rely on color alone for status.

## Non-negotiable product rules

- All credits are virtual with no monetary value. No deposits, card entry, cash balances, withdrawals, real-money prizes, subscriptions, payment buttons or currency symbols suggesting real money. Display VC / ВК. The dashboard pool total is the combined pool of the user's active challenges, not a personal wallet.
- Circles are private. There is no public discovery directory, public leaderboard, follower system, direct messaging or public proof-sharing feature.
- Roles are Circle owner and member. Any current member can propose a challenge. Only the Circle owner generates invitations, edits Circle details or archives it. Only the challenge proposer or Circle owner activates/cancels a proposal. Creating a challenge does not automatically enroll its creator.
- Each participant explicitly accepts that exact published rules version. Published rules cannot be edited, even before activation: cancel and create another proposal to change them. Activation locks the accepted participant roster. There must be at least two accepted participants; unanimous acceptance by all Circle members is NOT required. Members who did not accept sit out.
- An active challenge can have future scheduled dates: activation does not open uploads before the configured date/time. No joining or withdrawal after activation.
- Uploads are allowed only for today's scheduled obligation inside its opening/closing window, in the challenge timezone. Server receipt time is authoritative. No early, late or backdated proof. One submitted photo per obligation; no edit/delete/resubmit controls after successful submission.
- New challenges use chosen grace dates. A participant can reserve their OWN scheduled day before its deadline, including a future day. They cannot reserve a day with submitted proof. The challenge-wide allowance is limited. They can cancel/change the reservation before its deadline. A chosen day requires no proof, incurs no penalty and is excluded from the score denominator. Unused allowance is NOT assigned automatically. Legacy challenges retain automatic earliest-miss grace: show their original rule and no manual date controls. Do not silently convert them.
- Current AI is an honest DEVELOPMENT MOCK. It checks that a readable image arrived; it does not analyze visual contents or prove an activity occurred. It never accepts/rejects proof. Do not invent confidence scores, fraud scores, verified capture time or automatic AI approval.
- Review requires eligible accepted participants other than the author. A strict majority of eligible peers is required. Rejection and dispute resolution require at least two independent reviewers. One person's negative vote does not instantly reject proof or finalize a penalty. Small Circles may lack enough reviewers; show an unresolved state rather than inventing an owner override.
- One dispute round is supported. Authors can appeal their rejected proof; other eligible participants can dispute an accepted/rejected decision. The new round requires fresh votes; eligible previous reviewers can vote again. Authors never review themselves. Reviews close after settlement. Unresolved reviews/disputes block final financial settlement.
- Reactions and comments are encouragement, never verification votes. Current Circle members can comment/react even if they sit out of the challenge. Comments are plain text, not a chat or threaded reply system.
- Settlement waits for all deadlines, resolved reviews and at least 24 hours after the last deadline/review event. A five-minute job checks readiness; this is not a promise of execution at an exact second. Any current Circle member may finalize when the server reports ready. There is no moderator decision bypass.

## Shared application shell

Public pages have a simple brand/header and account actions. Authenticated pages share consistent navigation: Overview, My Circles, Activity and Settings. The notification bell opens Notifications and shows an unread badge. The profile control opens Settings. Mobile navigation must leave forms and sticky action bars usable; desktop may use a sidebar or another clear equivalent. A secondary Roadmap link is allowed. Show current location and sensible Back actions.

Protected links send signed-out users to Login. A signed-in user with incomplete onboarding goes to Onboarding. Preserve a pending invitation through signup/login/onboarding. Do not expose private Circle details before successful authenticated joining. Logout ends the session and returns to Login.

## Exact pages, purpose, controls and states

### 01 — Landing `/`
Explain the product through the actual sequence: form a private Circle → accept a challenge → submit photo/context → peer review → virtual results. Primary CTA goes to Register for visitors and Overview for signed-in users. Login goes to `/login`. Explain virtual-only stakes and private proof. Use a distinctive composition, not three identical feature cards. Marketing illustrations must be clearly illustrative, never presented as the user's real data.

### 02 — Register `/register`
Fields: email, unique username and password. Username: 3–24 lowercase Latin letters/digits/underscores, starting with a letter. Password: 8–128 characters. Include password visibility toggle, Create account, and Login link. Show field validation, duplicate account, request progress and server error states. Successful signup requiring email confirmation shows a Check your email state; never falsely present the user as authenticated before confirmation. Do not add Google/Apple login, phone verification or unimplemented resend controls.

### 03 — Login `/login`
Email, password, visibility toggle, Log in, Forgot password and Create account. Errors include invalid credentials and unconfirmed email. Successful login goes to incomplete Onboarding, otherwise the preserved invitation when present, otherwise Overview. Include submitting state and prevent repeated submissions.

### 04 — Forgot password `/forgot-password`
Email, Send recovery link and Back to login. Display a neutral confirmation that does not reveal whether the account exists. Include invalid email, submitting and network error states. Recovery is an email link, not an SMS/code-entry flow.

### 05 — Reset password `/reset-password`
With a valid recovery session/link: new password, visibility toggle, Update password, success and Go to login. Minimum eight characters. With an invalid/expired/missing link: explain and link to Forgot password. Do not show a usable reset form without a valid recovery session.

### 06 — Onboarding `/onboarding`
Collect display name (1–60), username (same rules as registration), timezone and optional bio (up to 240). Timezone initially suggests the device timezone. Continue saves the profile and finishes onboarding, then opens the preserved invitation or Overview. Show validation/save failure. No goal quiz, bank setup, avatar upload or compulsory challenge enrollment.

### 07 — Join Circle `/join`
Accept an invitation link or its 64-character code. A received link may contain `#token=...`; do not require retyping it. Signed-out state offers Login/Register while preserving the invitation. Signed-in state has Join Circle. On success open Circle details. Handle invalid, expired, full, already-joined and joining states. Do not show an unauthenticated private membership/photo preview or a global group search. Owners create invitation links, not emails sent by this screen.

### 08 — Overview `/app`
The personal next-action hub. Prioritize today's scheduled commitments and relevant challenge links. Show actual active challenge count, Circle count, accepted proof days and combined active virtual pool, with piggy-bank icon. Label the pool so it cannot be mistaken for spendable personal money. Today rows show challenge/Circle, deadline/timezone and an appropriate action leading to the proof page. Distinguish an upcoming window, open window, submitted day, chosen rest day and expired window. Actual personal achievements and recent account activity may appear below.

Create Circle opens `/app/circles/new`; My Circles opens `/app/circles`; commitment action opens that challenge's `/evidence`; activity opens `/app/activity`. First-time state contains honest zero values and Create/Join Circle guidance. No invented streak, rank, balances or notifications. Personal achievements are first accepted proof, seven accepted proofs, thirty accepted proofs and first completed challenge, based on real totals.

### 09 — My Circles `/app/circles`
List current Circles with name, description, icon, member count and owner/member distinction. Open Circle goes to its details. Create Circle goes to the creation form. Join via invitation opens the invitation flow or an inline code form using the same behavior. Include Show archived Circles, zero-Circle state, loading and retry. There is no public Explore tab.

### 10 — Create Circle `/app/circles/new`
Name (3–60), optional description (up to 300), and one icon: flame, sun, book, dumbbell or sprout. Create saves and opens the new Circle. Back/Cancel returns without creating anything. Do not present a photo-upload avatar picker. Owner can generate an invitation after creation.

### 11 — Circle details `/app/circles/:id`
Header with Circle name/description/icon, member count and role. Show members, proposed/active/completed/cancelled challenges and a chronological Circle activity feed. Every challenge shows which CURRENT Circle members accepted, did not accept or withdrew; show this directly on the Circle page, not hidden only in challenge details. Separate Circle membership from accepted challenge participation.

Open challenge goes to its details. New challenge is available to current members of a non-archived Circle. Owner-only Invite friends generates a private link, shows server-provided expiry/use allowance and has Copy link with copy feedback/fallback. Current links expire after seven days and admit at most 25 joins; treat server values as authoritative. Do not add contacts selection, SMS delivery or fake invitation-sent states.

Owner-only Manage Circle edits name/description/icon. Save persists them. Archive requires confirmation, is blocked while any challenge is active and cancels proposals while preserving history. There is no permanent-delete or unarchive action. Non-owner Leave Circle requires confirmation: withdraw from accepted proposals first; active accepted participants cannot leave before resolution. The owner cannot leave or transfer ownership in this version. Do not offer kick/ban/promote actions. Archived state is read-only for creation/management actions and retains history.

### 12 — Create challenge `/app/circles/:id/challenges/new`
An accessible wizard or well-organized form is fine, but preserve every field: title (3–80), description (up to 1,000), start/end dates, IANA timezone, selected weekdays, daily opening time, daily closing time, evidence requirements (10–500), camera-only versus camera-or-upload, virtual penalty per missed day, maximum total virtual penalty and grace-day allowance.

Defaults may select all weekdays; users can select any nonempty subset. Start is tomorrow or later in the challenge timezone. Length is at most 90 calendar days. Opening must precede closing on the SAME day; no overnight windows. Selected dates must contain a scheduled day. Grace allowance is 0–7 and smaller than the number of scheduled days. Penalty is 0–1,000 VC/day; cap is 0–10,000 VC and at least the per-day penalty. Support at most two decimal places in credit inputs; calculations use integer minor units.

Include a plain-language rule summary before Publish proposal. Explain chosen grace, the fixed 80% eligibility threshold, proportional virtual rewards and the irreversible rule publication. Publishing creates a PROPOSAL and opens its details; it neither activates the challenge nor accepts rules for the creator. No custom reward-formula, custom eligibility, arbitrary AI policy or edit-after-publishing controls. Server validation can reject DST window collisions. Back/Cancel does not publish.

### 13 — Challenge details `/app/challenges/:id`
Show title, description, Circle/back link, status, dates/timezone/weekdays, exact upload window, evidence/source rules, daily penalty/cap, grace policy, reward rules, acceptance roster and the current user's frozen schedule when enrolled. Include a secondary immutable rule-version/fingerprint detail.

PROPOSED: checkbox explicitly accepts CHALLENGE RULES, not a mislabeled privacy-policy checkbox. Accept rules & join is disabled until checked; success records that exact version. Accepted users can Withdraw before activation. Owner/proposer can Start and lock participants only when at least two accepted; show a confirmation with included names and members sitting out. Nonaccepting members do not silently join. Owner/proposer can Cancel proposal with confirmation. No editing published rules.

ACTIVE: rules/roster locked. Primary Submit/review proof opens `/evidence`; Standings & pool opens `/competition`. An accepted participant sees their own schedule; a sitting-out member sees an observer state and cannot upload/vote/reserve grace. If dates have not started, clearly show the first opening time.

COMPLETED: View final results opens the same competition route in settled state; proof/history remains viewable with voting closed. CANCELLED: read-only history, no acceptance/start/upload controls. Do not invent a pause, restart, extend deadline or reopen settlement button.

### 14 — Proof workspace `/app/challenges/:id/evidence`
Design one connected workspace with clearly discoverable Submit, History/review and My grace days sections/tabs. They share the same route/data; they are not separate products.

SUBMIT: show scheduled date, challenge timezone, opening and closing times, evidence requirements, eligibility and explicit current window state. Take photo opens the device camera request; Choose photo appears only when uploads are allowed. Support JPEG/PNG/WebP; client files must be under 20 MB and are resized/validated. Camera mode is a requested source, not proof of capture time. Include preview, a note/context field up to 500 characters, and Submit private proof. Before submission the user may replace their selection. Show preparation/upload progress, error/retry and success. Block closed/early/late, nonparticipant, already-submitted and excused-day actions with explanations. Show upcoming opening rather than a misleading upload button. Photos remain private to Circle members; no public link/share controls.

HISTORY/REVIEW: show Circle submissions with person, obligation date, receipt timestamp, photo, note, readable status, development-mock explanation and review history. Distinguish pending upload, AI reviewed/awaiting peers, accepted, rejected, disputed; show expired/no proof on unsubmitted obligations. Do not label mock-reviewed evidence as verified completion.

Eligible peers can Endorse or Flag invalid, with a 5–500-character explanation. Hide voting for the author, sitting-out members, already-voted users, settled challenges and closed decisions. Show quorum/progress and waiting states. An author's rejected proof exposes Appeal rejection; eligible peers can Dispute a decided proof. Dispute reason is 10–500 characters. Display the new review round, retained previous history and one-dispute-round limit. No edit vote or unilateral owner resolution.

CONVERSATION: expand on a proof for encouragement and plain-text comments. Three toggle reactions only: clap, fire and heart, with counts/own selection. Comment is 1–1,000 characters. Only the comment's author sees Remove my comment; retain a removed placeholder. No deleting others' comments, threaded replies, DMs, arbitrary emoji picker or treating reactions as votes.

MY GRACE DAYS: own allowance remaining, scheduled date list/calendar and chosen dates. Use grace day reserves an eligible own date, Cancel grace day releases it, and choosing another date after cancellation uses the same allowance. Show deadline, used-up allowance, already-submitted, locked/past and legacy automatic-policy states. Confirm that choosing rest blocks proof for that day until cancelled. Other people's planned grace dates are not available; do not expose them in a shared calendar. Aggregate grace counts remain available in standings.

### 15 — Competition, pool and results `/app/challenges/:id/competition`
One page with sections/tabs for Standings, Virtual pool, Ledger and Rules. Design its provisional, blocked, ready and settled variants rather than creating unrelated routes for leaderboard/pool/final results.

Piggy-bank pool display clearly distinguishes projected from final. Standings use actual rank/name, successful days, scored-day denominator, completion percentage, streak, missed/grace counts, unresolved/future count, virtual penalties, eligibility and projected reward/refund. Tied scores can share rank. Refresh fetches current standings.

Show fixed 80% eligibility after grace. Eligible rewards are proportional to exact discipline scores. Rounding uses largest remainders with deterministic ties; total distributions equal the pool. A zero pool pays zero. If nobody qualifies, contributions are refunded. Explain the applicable legacy/chosen grace policy and penalty cap without editable controls.

BLOCKED/provisional: explain pending deadlines, open reviews/disputes and/or appeal period; show earliest settlement time if supplied. No final ledger entries yet, and no active Finalize action. READY: any current Circle member can Finalize virtual results; show submitting/error states. Server remains authoritative. SETTLED: final immutable rankings, reward/refund breakdown, ledger and a tasteful completion moment. Every ledger item shows unique transaction ID, person, reason, kind and exact virtual amount. Remaining pool is zero; no repeated payout or withdrawal button. Do not add prize claims, real-wallet transfers, live cash charts or a new administrator approval step.

### 16 — Personal activity `/app/activity`
Chronological ACCOUNT activity: account creation, onboarding completion and profile updates, with timestamps and honest empty/error/loading states. Circle social activity lives on Circle details. Do not invent an API-backed global friends feed, public posts, compose box or infinite history; only available returned activity can be shown.

### 17 — Notifications `/app/notifications`
Private inbox of at most the latest 100 returned notifications. Types include approaching/missed deadlines, review requests, accepted/rejected/disputed proof, proposals, activation/completion, comments, grace reservations and monthly recap. Show timestamp, context and read/unread state. Mark as read affects only that item; Mark all as read affects only this user's inbox. Open update marks it read and navigates to the corresponding challenge, proof workspace or results. Recaps show the returned month/submitted/accepted counts inline; do not invent a separate detailed analytics page. Bell badge reflects unread items. Empty state is calm. These are IN-APP notifications only; no fake push/email delivery settings or browser permission flow.

### 18 — Profile and Settings `/app/settings`
`/app/profile` redirects here; no separate public profile page is required. Editable display name, username, timezone and optional bio, with Save changes, validation and saved/error states. Email is displayed read-only. Password reset links to the recovery flow. Logout ends the session. Profile avatar is initials; no camera/edit-photo button.

Appearance has two independent controls: Dark/Light and Orange/Electric lime. Language has English/Русский. Theme and language choices save immediately to the account, show selected/busy/error states and persist after reload/login; profile fields use their own Save action. Show previews without resetting choices when switching between controls. Do not add unsupported email changes, account deletion, billing, wallet, push toggles or two-factor settings as functioning controls.

### 19 — Secondary roadmap `/app/roadmap`
A small informational page showing implemented capabilities and remaining work, with Back to Overview. Lower priority than core flows. No decorative future feature should appear as an enabled action elsewhere. Remaining work can mention real-device testing, retention/account deletion, stronger abuse controls, paid vision integration and push notifications without pretending those exist.

### 20 — Utility/error states
Design a 404 state with Home/back navigation, session-expired/login recovery, inaccessible private resource, network failure with retry, and a recoverable application error. Do not leak private Circle information in access-denied messages. These are shared utility states, not a new suite of product features.

## Deliverables and acceptance criteria

1. All 18 primary pages, plus the secondary roadmap and shared error states. Name designs with the numbers/routes above. Do not silently omit a page.
2. Show the stateful variants: email confirmation/reset errors; first-use empty dashboard; proposed/active/completed/cancelled challenge; accepted/sitting-out user; opening/open/closed upload; pending/accepted/rejected/disputed proof; available/chosen/exhausted/legacy grace; provisional/blocked/ready/settled competition; read/unread notifications.
3. Include the owner/member/author/reviewer variations. Do not confuse a Circle owner with a reviewer or automatically enrolled challenge participant.
4. Establish shared typography, spacing, color tokens, status semantics, navigation, inputs, buttons, dialogs, loading skeletons, empty/error states and toast behavior. Include desktop and mobile for the main workflows. Show theme variants on Overview, Settings, proof and pool; include Russian versions of Settings, challenge creation and proof to demonstrate long-text resilience.
5. Connect every enabled button to one of the listed navigation/mutation behaviors. Tabs, expanding details, dialogs, local filtering and previews are allowed presentation changes. Every data-changing action must correspond to an existing capability above. Do not add unsupported buttons and assume engineering will invent their backend later.
6. Use realistic, internally consistent sample data solely to illustrate design. Success and failure screens must be states of the same feature, not disconnected mockups. Clearly distinguish private member data, personal data, projected calculations and final results.
7. Make the core journeys effortless: register → confirm → onboard → create/join Circle → publish proposal → individually accept → lock roster → reserve rest or submit within window → independent review/dispute → provisional standings → settled virtual results. Preserve these rules even when changing layout dramatically.

If a requested interaction cannot be represented, identify it explicitly instead of silently changing the business rule. Prioritize functional correspondence, visual distinctiveness and a clear next action over decorative complexity.
