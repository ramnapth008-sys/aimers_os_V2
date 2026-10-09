# AIMERS OS — Three-Minute Onboarding, Persistent Profile, Automatic Digital Intelligence and Adaptive Feed

**Status:** Architecture specification for user review, not implemented.
**Date:** 2026-10-09
**Dependencies:** Learning Graph, Behavior Intelligence, Social Feed Exposure Intelligence specifications on this documentation branch.
**Intent:** Subscription-funded, no personal data sale. Adult (18+) pilot. After initial, explicit platform-specific authorizations, start automatic locally processed intelligence and demonstrate a useful, evidence-backed student status within three minutes.

## 1. Approved product brief and experience

New subscriber signs in by **email OTP or phone SMS OTP** (not a user-chosen password), sets persistent name, verified age/DOB eligibility, occupation/preparation status (school/college student, employed, competitive exam aspirant, other; multiple may apply), preparation target, language and preferences. Data is stored to the account with editing and deletion controls and used for future sessions, not asked every visit. No birth-date inference from browsing. Verification and fraud/abuse controls are mandatory; phone OTP is vulnerable to SIM swapping, so sensitive account recovery or data export needs step-up authentication.

New adult explicitly enables categories of data collection and optional local feed-content analysis. OS/browser/provider permissions are separate. The user can decline invasive monitoring yet manage their basic account where feasible; accepting a blanket privacy agreement is not equivalent to each required platform scope.

**Three-minute SLO:** from verified login to first usable, evidence-backed personalized dashboard, assuming ordinary connectivity, supported local installation/permissions, and no provider/API outages. Not a guarantee of a complete historical import or all device permissions. An initial dashboard can report accurate “not yet connected” and “insufficient history” fields; background enrichment continues. No phony progress or invented historical status. Target a p90 end-to-end initialization time <=180 seconds among eligible pilot setup sessions meeting documented prerequisites, with step-specific traces and fallback on slow sources. External SMS arrival/install/manual OS prompts excluded from the internal processing latency metric but counted visibly in overall user journey; don't market an unconditional 3-minute guarantee.

## 2. Architectural approach

**Chosen:** local-first sensitive observation + selective authorized synchronization + server account and academically necessary metadata. Highly sensitive raw URLs, detailed searches, captured feed content and local user-mood records **stay device-side by default**. Subscription billing and account identity live in the server. Derived academic results, source-confirmed lecture status and select analytics can synchronize only by independent, understandable scopes. User may disable sync. The previous document's cloud raw-activity design is superseded for highly sensitive fields; a 365-day retention preference may govern locally held authorized detailed activity, whereas raw third-party social content uses separate shorter lawful retention. No raw sensitive content in telemetry, error logs, support tickets, embeddings or hosted LLM calls by default.

**Automatic intelligence:** event-driven connectors and local processing initiate after the relevant permission is granted; they continue in the permitted background subject to OS limits. Login is not authorization for other apps, and OS platform restrictions still apply. “Automatic improvement” means (a) AIMERS **owns and automatically re-ranks its own knowledge/growth feed** according to disclosed user choices; (b) where official external platforms offer a supported authenticated write action and student permission, AIMERS may apply the change and audit success; (c) otherwise the external system is not modified, and AIMERS reports that state without pretending success. User need not approve each routine action already within an agreed narrow automation scope, but platform confirmation requirements cannot be suppressed.

## 3. Onboarding flow and timing

1. `AUTH`: Enter email or E.164 phone; request OTP; single-use time-limited code, hashed/challenge storage, rate limits, resend cooldown, anti-enumeration, bounded attempts, device risk and session rotation. Verified account lookup or safe creation.
2. `PROFILE`: Name, age eligibility from verified evidence where possible, occupation/preparation status, exam/career goal, target year, learning preferences and language. Save a versioned StudentIdentityAndGoalProfile. Distinguish self-declared DOB from independently verified adult eligibility. Store only evidence necessary for age gating, never retain raw identity evidence by default.
3. `DISCLOSURE`: Explain activity categories, feed-content access and processing, local vs cloud storage, human/AI access, retention, external platform effects, user controls, model limitations and subscription. Require explicit granular opt-in separately from essential terms.
4. `CONNECT`: Start capability-based source connection flows for installed authorized collectors. Show exact permissions and unavailable sources. Never claim access to native Instagram/YouTube watch history where none exists. Browser history may require extension installation and history permission; YouTube viewing history is not generally retrievable from ordinary YouTube Data API; user-approved exports/imports may be supported.
5. `LOCAL_ANALYSIS`: Import permitted available records; dedupe browser/device intervals; classify academic vs social use with abstention and unsupported coverage; recognize known source courses and lecture observations; feed safety samples when content actually accessible; compute measurable metrics. Keep partial-data labeling.
6. `READY`: Render truthful dashboard and suggested actions, with enrichment jobs continuing. Never fabricate comprehensive history, confidence scores, or feed toxicity from unsupported native apps.

Stages emit actual events `PENDING|RUNNING|SUCCEEDED|SKIPPED|UNAVAILABLE|FAILED|DEFERRED`, tasks done/total only for known finite tasks, elapsed duration and source last update. Animated setup presents “Secure account”, “Your goals”, “Checking permissions”, “Connecting sources”, “Learning about your activity”, “Preparing AIMERS”. Respect reduced-motion preference. No blocking spinner past target if some sources are unavailable.

## 4. Client architecture / animated startup

Web: existing `apps/web` React/TypeScript; motion via native CSS reduced-motion-capable transitions or existing motion dependency after implementation audit. Components `OtpLogin`, `IdentityGoalForm`, `PrivacyScopeWizard`, `ConnectorCapabilityCards`, `IntelligenceBootScreen`, `InitializationProgress`, `CoverageSummary`, `FirstDashboard`. Separate web profile collection, optional browser extension and desktop/mobile agent to avoid promise that a web login alone reads all devices. OTP can fail; resend and fallback to the other verified method. Mobile deep links can trigger platform permission UI without circumventing it.

Accessible animation: meaningful stage labels, stable progress UI, keyboard navigation, semantic announcements, no seizure-prone rapid transitions, respect `prefers-reduced-motion`. Present users with real time and distinct “Analyzing on your device” vs “Waiting for permission” or “Source unavailable”.

## 5. Technical service boundaries and proposed schemas

Backend NestJS `apps/api`; Prisma `packages/database`. Existing `StudentProfile` includes `dateOfBirth`, `examTarget`, `targetYear`, existing `User`/auth models, `ConsentGrant`/`PrivacyPreference`, `DataConnector`, `ActivityEvent`, `LectureSession`. Do not assume an OTP provider or auth handler already exists.

Design candidate entities:
- `AccountLoginIdentifier`: user, type EMAIL/PHONE, normalized value, verification timestamp, primary flag, uniqueness and reuse/account-link protections.
- `OtpChallenge`: purpose, channel, identifier hash, expiry, attempt count, resend cooldown, abuse scoring, status and non-recoverable challenge proof. Never store plain OTP.
- `PersonalGoalProfile`: student, display name (not necessarily legal name), role set, exam/career goals and target year, language, settings, profile source and updatedAt, fields completeness.
- `AgeEligibilityVerification`: verified 18+ status, verifier method, verification time and expiry; separate from self-reported DOB and enrollment claims. Unverified age blocks adult-only monitoring.
- `OnboardingRun`: student/device, workflow state, startedAt, stage timestamps, outcome, capability snapshot and performance measurements.
- `CollectorPermissionState`: device, source, per-field/per-purpose scopes, OS permission observed, scope grant ID and revisions, revoked/paused, supported capabilities.
- `HistorySourceImport`: imported source, consent record, user-requested time range, bounded cursor/checkpoint, completeness, failures and local data location; no server-side raw history by default.
- `LocalIntelligenceSnapshot`: device-signed result hashes, source coverage, metric ruleset version, calibrated classifications and evidence links (local), local TTL. Optional cloud sync through separately approved summary payload.
- `FeedOptimizationPreference`: user goals, permitted preference categories, active sources, exclusion rules, opt-out.
- `FeedOptimizationAction`: provider, action scope, local/authorized remote, invocation identity, idempotency key, verified result/blocked/retry with reason; NEVER report external recommendation changes from local re-ranking alone.
- `KnowledgeFeedCandidate`, `KnowledgeFeedRanking`, `KnowledgeFeedFeedback`: licensed/authorized content source, factual provenance, quality assessment, student choices, diversity/exploration budget and ranking version.

Possible endpoints (under existing `/api/v1` conventions): `POST /auth/otp/start`, `POST /auth/otp/verify`, `GET/PUT /student/profile`, `GET /onboarding/capabilities`, `POST /onboarding/runs`, `PATCH /onboarding/runs/:id`, `GET/PUT /privacy/collection-scopes`, `POST /connectors/authorization`, `GET /intelligence/coverage`, `GET /knowledge-feed`, `POST /knowledge-feed/feedback`, `GET /feed-improvement/actions`, `POST /privacy/export`, `POST /privacy/delete`. Precise route reuse vs addition requires a separate implementation plan; new scopes require explicit schema migrations, never generic reuse.

## 6. Source coverage and historical imports

**Browser history:** supported browsers and explicitly permitted extension APIs can import accessible history metadata; queries aren't always available as exact queries and background history may be incomplete/incognito unavailable. Do not read password pages, banking/health/auth contexts, private communication content or ignored domains. Imported browsing history is `visited`, not automatically `read` or `academically relevant`.

**YouTube:** official data APIs generally do not offer ordinary personalized watch history. Supported browser observations can analyze permitted viewing events going forward. Opt-in user-directed Takeout or platform export files may be parsed on-device subject to format/terms, and are marked `IMPORTED`, not real-time telemetry. Do not claim an export is guaranteed or complete.

**Instagram/other native social apps:** foreground duration may be visible where an approved OS usage API allows it; feed/watch history is not exposed by ordinary usage grants. Content analysis and automated feed changes require a separate supported integration or user-shared/authorized data. No attempts to bypass access controls, misuse AccessibilityService, employ covert screen recording or private API scraping.

Source statuses `CONNECTED_FULL_FOR_DECLARED_CAPABILITIES`, `CONNECTED_USAGE_ONLY`, `PARTIAL_CONTENT_SAMPLE`, `IMPORT_IN_PROGRESS`, `PERMISSION_REQUIRED`, `UNSUPPORTED`, `BLOCKED_BY_PROVIDER`, `DISCONNECTED`. These may coexist on independent capability dimensions. "No detected feed toxicity" only applies to analyzed items and never to unobserved content.

## 7. Feed improvement engine

**AIMERS-owned knowledge feed:** user chooses science, technology, NEET/JEE, career, health, hobbies and other subjects. Build licensed/authorized content index, a recommendation engine with source credibility checks, student-level ranking preferences, correction feedback, topic diversity and no sensitive-personality manipulation. Automatically re-rank within the app while respecting user options. Avoid encouraging compulsive consumption; provide session limits/focus modes controlled by user.

**External social feeds:** `ProviderFeedActionAdapter` exposes `READ_CAPABILITY`, `WRITE_CAPABILITY`, permissible operation type (e.g., explicitly supported preference reset/toggle/follow/unfollow API), required scopes, confirmation and status. If and only if provider supports authorized automated writes, execute narrow agreed changes and verify results; logs are sanitized. If not, do **not** claim that AIMERS modified Instagram/YouTube feeds. Instead offer local AIMERS feed improvements; external actions remain unsupported rather than simulated. No policy evasion, browser automation that circumvents restrictions, misleading "done" state, or unrequested follows/unfollows.

Model content safety and academic relevance with calibrated uncertainty. Measured item exposure cannot measure student's mood, psychological toxicity, moral character or exam capability. Never prescribe student emotion from feed patterns. Avoid numeric "mind toxicity", avoid guaranteeing exam score improvement, and keep Mentor guidance opt-in and supportive.

## 8. Privacy and local-first AI

Subscription revenue only; explicitly no user data sale, broker transfer or advertising targeting. Raw browsing queries, detailed feed samples and voluntary mood stay in local encrypted storage by default. Local model inference is a real implementation obligation: no sending raw payload to hosted LLM or telemetry by accident. Capability-restricted device keys; authenticated short-lived collector tokens; browser extension cannot access full account auth. Sanitized opt-in diagnostics use strict field allowlist `version`, `platform`, `stage`, `code`, `latency bucket` and exclude raw URLs, titles, search strings, content, identity secrets, private prompts and media. Feedback voluntary, previewed, content redacted and separate from telemetry.

Derived metrics may synchronize **only under explicit `DERIVED_INTELLIGENCE_SYNC` authorization**; user has not yet made a final decision on whether cloud sync is opt-in or local-only, so this spec defines opt-in capability but does not require it for 3-minute local report. The user retains raw data with a proposed 365-day device retention preference subject to local laws and platform restrictions, while third-party raw social media content gets separate lawful TTL.

A local-only analytical product requires local compute resources/installed companion; browsers, iOS and low-memory devices have variable model capabilities. Fall back to measurable deterministic reports and a truthful “advanced classification pending/unavailable” state if the local model cannot process safely. Never silently send private raw data to the cloud as fallback.

## 9. Mentor and final status

First report: user name, role and goal, connected source inventory, observation and history-import window, measured app/site time, labeled learning evidence, unknown gaps and confidence. If no supported activity history is available, show profile/goal-based plan and empty evidence clearly. Feed safety shows only analyzed permitted content sample denominators and definition of flagged categories; no mind-toxicity judgment. Mentor recommendations reference actual metrics, provider courses and student preferences. Academic lecture completion continues to require provider confirmation or labeled self-declaration; observed playback alone does not complete.

The dashboard can include separate cards `My Learning`, `My Preparation`, `Behavior Intelligence`, `Feed Health`, with detailed pages elsewhere. The compact home screen emphasizes a single actionable Mentor insight.

## 10. Metrics, tests and release gates

Measure auth completion, profile completion, permission prompt outcomes, source-capability detection, initial report-ready latency, historical import progress, per-source capture coverage and local AI cost/memory. Do not include OTP delivery delay in core processing SLO without separately reporting full journey; show real-user end-to-end distribution. Analyze completion rates separately by platform/network.

Test: OTP replay/expiry/rate limit/phone reassignment; profile persists across sessions/devices; role changes do not delete historical learning facts; unverified adults blocked from sensitive monitoring; user declines optional scope and still sees permitted product; revoked scope stops collectors and jobs; source unavailable within 3-minute window doesn't block honest report; imported history isn't treated as watch feed; duplicate browser/desktop sessions don't double count; raw privacy data absent from logs/network sync; local model unavailable still shows reliable observed metrics; run state matches actual progress; no external feed “optimization” marked successful without authorized provider write + confirmation; source platform policy reviews; accessible reduced-motion boot screen; PW live connector regression tests.

Security and privacy/legal platform reviews mandatory before rollout. Architecture does not authorize implementation.

## 11. Relationship to existing branches and approval gate

This new design **supersedes cloud raw sensitive-data assumptions** in earlier Behavior Intelligence spec, while preserving earlier Learning Graph and Social Feed evidence principles. The selected local-first privacy boundary is a provisional interpretation of the latest user message; verify derived-metric sync preferences before implementing cloud summary jobs. Student still needs separate platform rights and consents.

Protect uncommitted local `/Users/ramnapth/Documents/aimers_pw_live_sync` changes (PW dual-host normalization and upload issues). The GitHub remote on this documentation branch may not include those local fixes. Do not reset, rewrite or cherry-pick blindly into existing worktree. User review of this written spec is required before the detailed implementation plan, followed by implementation authorization.
