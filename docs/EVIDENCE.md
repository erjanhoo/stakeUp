# Evidence and review — milestone 3

## Working behavior

An accepted participant opens an active challenge → Submit & review proof → selects camera capture or an allowed photo → adds context → submits during today's challenge-local window. The server checks ownership and receipt time, decodes the photo, limits dimensions, normalizes it to JPEG and removes metadata. The UI resizes supported photos before upload. JPEG/PNG/WebP inputs are supported; HEIC and animated files are rejected. Maximum incoming API image is 2.5 MB / 24 megapixels, request body 3.5 MB; client selection limit is 20 MB before resizing.

Production photos use a private Supabase `evidence` bucket. Immutable object paths are reserved transactionally for one participant/obligation, restricted by ownership and deadline, and cannot be overwritten or deleted by ordinary clients. Circle members read photos through an authenticated API proxy that revalidates/re-encodes the bytes, including objects uploaded directly with the Storage SDK. No public bucket or public photo URLs are created. Browser Blob URLs are revoked when the view closes. Local mode uses an ignored private directory alongside its account store; no static route exposes it.

Receipt time is the server's finish timestamp, not EXIF, device time or upload reservation time. A reservation does not extend the deadline. One finalized proof per obligation prevents overwriting reviewed evidence. Retry of an unfinished reservation reuses its immutable object; unfinished expired reservations display Expired. Missing submissions show Expired in the schedule after their deadline. Expiration is derived on reads; automatic financial deadline jobs remain phase 4.

## AI boundary

`VerificationProvider` is replaceable server-side. This release uses `development-mock-v1`: it does **not** analyze visual contents and says so explicitly. It records that a photo was received, lists unverified claims and always requests peer review. Database RPCs construct that fixed result themselves, so direct client calls cannot manufacture an AI acceptance. No paid AI provider, key, remote image transfer or automated completion decision exists in this release. Real model integration and duplicate/similarity analysis remain future provider work; no reuse/fraud detection claim is made.

Camera-only rules request camera capture through the device's native file capture flow. Browsers cannot reliably attest capture source, capture time, identity or completed actions; the interface explicitly explains this. A camera flag is not trusted as evidence of completion.

## Peer decisions and disputes

Only accepted participants may vote. Authors cannot vote on their own evidence. Each reviewer has one immutable vote per round, with a required reason. All votes, reasons, timestamps and transitions remain visible to Circle members. Row locks serialize decisions; direct table mutations are denied by grants and RLS.

The eligible set is the locked accepted roster excluding the proof author. An ordinary endorsement requires a strict majority of that set (minimum one). Rejection requires the same strict majority **and at least two distinct reviewers**. Therefore one hostile friend cannot reject evidence in a two-person Circle; that rejection stays unresolved. Small circles can still endorse ordinary proof.

The author can appeal a rejection; another participant can dispute a decided proof. A reason is required, the status becomes Disputed, and a fresh round starts. Both acceptance and rejection during this dispute round need at least two distinct reviewers and a strict majority. Prior votes remain in history but do not count again. One dispute round per proof prevents repeated freeze/reopen attacks. An unresolved dispute remains open with no automatic adverse decision. Two-person circles cannot resolve a dispute on their own; the UI explains the missing quorum. There is no hidden creator override.

No penalties or rewards are processed here. A later settlement implementation must block on Pending/AI-reviewed/Disputed states and must not treat missing quorum as rejection. Active challenge roster/leave locks from phase 2 remain in place.

## Verification and release

`npm run check` covers strict types, API/domain contracts, both builds and the production handler. Tests exercise image magic/metadata, forged input, ownership, private photo access, receipt deadlines, retry identity, self-review, immutable votes, rejection quorum and a fresh dispute round. Browser tests use three accounts for photo → rejection → appeal → two-peer acceptance at desktop and mobile sizes. Test-only schedule fixtures open today's window; production creation still requires a future start.

`supabase/tests/evidence.sql` exercises real PostgreSQL RLS/RPC and Storage **metadata** policies with four identities; its fixtures roll back. The plain PostgreSQL bootstrap is only a minimal Auth/Storage metadata fixture, not an emulation of the real Storage service. Managed Supabase upload/download and physical-device capture must also be checked after release.

Apply **only** `supabase/migrations/20261110000100_evidence.sql` to the existing project, then deploy API before web. Existing foundation/social migrations are already applied. No service-role key is required. New database functions and policies are additive. Do not run the plain PostgreSQL bootstrap in Supabase. See DEPLOYMENT.md for project IDs.

Still deferred: paid vision provider, duplicate/similarity analysis, proof revisions, profile/Circle image upload controls, pagination for large histories, retention/deletion tooling, notifications, virtual accounting and settlement. Account avatars remain initials; Circle avatars remain icons.
