# PW lecture → AIMERS account: live-sync integration pilot

**Status:** implemented as an unverified integration branch. The tested PW video player, browser permission status, API wiring and live end-to-end latency must be confirmed in the user's Chrome installation.

Branch: `codex/pw-account-live-sync-20261009`

## Architecture
- Browser tracker records **one** explicitly authorized `pw.live/watch` HTML5 lecture session locally.
- Extension Manifest V3 service worker answers exactly one **read-only** request, `AIMERS_LECTURE_SNAPSHOT_V1`, from **top-level** `http://localhost:5183`. The manifest has `externally_connectable.matches=["http://localhost/*"]` because match patterns don't support arbitrary port specificity; the service worker additionally rejects every other port, hostname and sender frame.
- The AIMERS React dashboard reads the snapshot, without sharing its bearer token with the extension, and uploads via authenticated `POST /activity/lectures/progress`.
- The server requires an active monitoring preference, lecture progress and cross-device consent, adult age verification, a consistent PW collector ID, validated nonnegative counters and timestamp ordering. It writes session measures into the existing `LectureSession.metadata` JSON field; **no Prisma migration required**.
- `GET /activity/lectures` returns previously saved sessions for signed-in readers; the dashboard refreshes every 8 seconds when visible and on focus.
- The uploader uses a per-account exclusive Web Lock to avoid concurrent uploads from multiple AIMERS tabs. Only an open AIMERS dashboard in the same Chrome profile uploads; other devices read server records.

## Important privacy and accuracy limits
This is an **adult-only technical pilot**: not a deployment for children. Missing date of birth is rejected for account uploads. Student must separately (1) install/authorize the Chrome extension on PW, (2) check the fields/scopes on the AIMERS dashboard and select **Connect and save PW lectures**, and (3) pass server-side consent and privacy checks. Granting generic privacy terms alone does not provide Chrome permission.
The extension shares only explicit fields: stable collector UUID, UTC measurement/start times, PW hostname, displayed page title, video length, elapsed session seconds, total playing seconds, last playback position, pause count, rewind count and state. No URLs, authentication tokens, page contents, browser history, messages or screenshots.
Accumulators are observed estimates, **not** unique content coverage, comprehension or confirmed topic mastery. Chapter mapping is not implemented. Session elapsed includes paused time. PW player compatibility is **not confirmed**; protected/iframe players may remain inaccessible.
Sync does not provide full offline history. Only the extension's latest local summary exists; if the dashboard is closed, it will not upload until the dashboard reopens, and older replaced snapshots cannot be reconstructed. New account connections only accept collector sessions begun after the account connection, preventing previous accounts' local snapshots from being uploaded.
Disconnecting account sync stops AIMERS website uploads but does not automatically delete server records or revoke global monitoring scopes used by other functions. Those can be managed through Settings.

## Mac development setup (new isolated worktree)
Stop old Vite port 5183 and existing API port 4000 processes from their own terminals first; do not kill unrelated processes.
```sh
cd /Users/ramnapth/Documents/aimers_os_V2
git fetch origin
git worktree add -b codex/pw-account-live-sync-20261009 ../aimers_pw_live_sync origin/codex/pw-account-live-sync-20261009
cd ../aimers_pw_live_sync
pnpm install
```
Copy the already-working **untracked** API environment for local development only, preserving secrets:
```sh
cp /Users/ramnapth/Documents/aimers_os_V2/apps/api/.env apps/api/.env
```
Do not commit or paste `.env`; ensure it remains ignored. The configured `CORS_ORIGINS` must contain `http://localhost:5183`.

Install **only one** unpacked extension: `apps/browser-extension` from this **new** worktree. Remove earlier AIMERS tracker duplicates in `chrome://extensions`. Note its actual **32-letter extension ID** shown on the card; it may differ from earlier installations. In the PW extension popup select **Enable on PW** and grant Chrome permission. Open an actual `pw.live/watch` page and reload.

Create `apps/web/.env.local` (untracked) with the extension ID (no secrets):
```dotenv
VITE_API_URL=http://localhost:4000/api/v1
VITE_AIMERS_LECTURE_EXTENSION_ID=YOUR_REAL_32_LETTER_CHROME_EXTENSION_ID
```
Start **one** API from the new worktree:
```sh
pnpm --filter @aimers/api dev
```
Then from another terminal in this same worktree:
```sh
pnpm --filter @aimers/web exec vite --host localhost --port 5183 --strictPort
```
Run build and validation commands:
```sh
node --test apps/browser-extension/background.test.mjs
pnpm --filter @aimers/web build
pnpm --filter @aimers/api typecheck
pnpm --filter @aimers/api exec tsx --test src/modules/activity/dto/upsert-lecture-progress.dto.spec.ts
```
If backend typecheck requires Prisma client generation, use `pnpm --filter @aimers/database prisma:generate` with the copied working `.env`. Do not migrate/reseed/reset the database.

## Enable syncing and test
1. Sign in to `http://localhost:5183/dashboard` using an **adult account with a verified date of birth**.
2. In **Learning activity**, review the proposed data fields and the 3 required scopes, tick the consent checkbox, and click **Connect and save PW lectures**. If consent/policy eligibility blocks it, follow the existing Settings flow; do not bypass.
3. With AIMERS dashboard open, **reload the PW lecture** after connecting to begin a fresh collector session. Confirm the extension popup shows a measured video rather than 'not tracking'. The video must be an HTML5 player exposed in the top frame; if it isn't, don't simulate observed data.
4. Play ~15 seconds, pause, rewind several seconds. Observe the dashboard counters changing without manual refresh (target up to 5 seconds), and the status '**Live · saved to your account**'. If no extension snapshot is found, check Chrome site permission, extension worker errors, actual ID, and iframe limitations.
5. Reload AIMERS while logged in. Confirm the saved session remains present.
6. In another signed-in browser or device, open AIMERS dashboard without the extension and confirm the saved lecture record arrives via `GET /activity/lectures` (target 10 seconds while visible).
7. Disconnect in AIMERS to stop browser-to-account uploads; verify the last saved record remains. Pause global monitoring or revoke scopes in Settings and confirm API uploads stop.
8. With two dashboard tabs open in the **same Chrome profile**, only the Web Lock holder should upload; the other reads saved sessions.
9. Check browser DevTools and API logs; never paste auth tokens, full PW watch URLs, private batch identifiers or `.env` secrets.

## Not yet production ready
Need successful PW real-player capture, browser/service-worker tests on Chrome, working authenticated account verification, comprehensive API service integration tests, latency measurements, multi-browser compatibility and minor-safety legal review. The website sync runs only while the **dashboard page** is mounted; a true background account uploader requires a separate authorization/device pairing design. Existing student dashboards for other routes remain unchanged.
