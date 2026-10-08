# AIMERS Lecture Tracker — local-only adult pilot

## Purpose
A manually activated Chrome Manifest V3 extension to measure playback of one accessible HTML5 video in the current tab. It is a **prototype**, not a production integration and is not wired into AIMERS backend.

## Install
1. On Mac, fetch branch `codex/lecture-tracking-local-pilot-20261008`.
2. Open Chrome -> `chrome://extensions`.
3. Enable Developer mode -> Load unpacked.
4. Choose the repository's `apps/browser-extension` folder.
5. Open a normal HTTPS page with an accessible HTML5 `<video>` element; play it, then click the extension icon and **Start on this tab**. Use Stop to end capture, Clear data to erase the last local summary.

## Captured data
- Current tab's document title and hostname
- Published video duration, last playback position
- Wall-clock elapsed session (since explicit Start)
- Accumulated time the player is playing (estimated, not distinct-video coverage)
- Number of pause events after video has played
- Backward seeks greater than 2 seconds

Saved only under `aimersLectureSummary` in extension-local storage. No browsing history, searches, messages, keyboard events, social feeds, screenshots, or personal credentials are collected. No network upload. No content script executes until the user presses Start on the active tab. Navigation normally ends tracking. Only one summary is retained; it can be cleared in the popup.

## Accuracy and boundaries
- Generic HTML5 videos in the top frame only; cross-origin iframe video players cannot be monitored by this version.
- Streaming sites may use custom players or change controls; provider compatibility is **not yet validated**. Do not claim Physics Wallah, Vedantu, YouTube or other sites are supported until verified.
- Each pause event is counted separately, even if the user resumes immediately.
- Rewinds count backward seek events (>2 s), **not** skipped content or repeated comprehension.
- Elapsed includes the student's pauses and time since activating tracking while the page is open; play time measures the player's unpaused time and can include time in a background tab. Those numbers are not a judgment of study effort or comprehension.
- A player changing during the session requires restarting. Closing the tab/navigation stops the collector; local summary may be delayed by up to 3 seconds in abnormal browser termination.
- No topic, chapter, exam or backlog inference occurs.
- Only pilot with adults; do not distribute to minors before legal and child-safety review.

## Test checklist
1. Without clicking Start, browse normally. Verify there is no activity capture.
2. Start on an HTML5 video; see title, hostname, duration and position.
3. Play 10 seconds; check the play time grows.
4. Pause twice; check two extra pauses and stable play time.
5. Seek backward >2 seconds; check rewind count increments.
6. Stop; values should remain constant.
7. Clear; summary disappears.
8. Reload/navigate; tracker stops. Observe no cross-tab tracking.
9. Check DevTools Network: no AIMERS uploads.
10. Try a cross-origin iframe; observe unsupported message instead of invented tracking.

## Next integration milestone
Security review, age verification, student login through extension-specific OAuth PKCE/device authorization, allowlist of tested sites, explicit `LECTURE_PROGRESS` scope, owned connector/device registration, consent receipts, event batching, server-side input validation and rate limiting, app UI source labels, session deduplication and pause/rewind schema. Verify actual backend rejects expired/revoked consent. No copying AIMERS authentication tokens into popup settings, no hardcoded credentials, and no `localhost` credential leakage.

## PW compatibility diagnostic (iteration 0.1.1)
1. Visit an actual logged-in lecture playback page, not `https://www.pw.live/` homepage.
2. Click the extension's **Start on this tab**. It now waits up to 20 seconds for a dynamically inserted HTML5 `video` element in the top-level document.
3. If the message reports no exposed video, that page likely has no player, or uses an embedded or otherwise inaccessible player. No tracking is claimed. Do not bypass DRM or provider access controls.
4. Send a screenshot of the error and a **redacted URL/path** of the lecture page (remove tokens, personal query parameters and student identifiers) for further integration assessment.
5. Reload the unpacked extension in Chrome `chrome://extensions` after pulling changes.

This revision is untested against a live PW lecture and does not add new permissions, network uploads, cross-origin iframe access, or background browsing capture.
