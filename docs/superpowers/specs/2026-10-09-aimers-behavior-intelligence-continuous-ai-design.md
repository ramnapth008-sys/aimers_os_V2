# AIMERS OS — Behavior Intelligence, Continuous AI & Secure Activity Cloud

**Status:** Design specification for user review; not implemented.  
**Date:** 2026-10-09  
**Companion:** `2026-10-09-aimers-learning-graph-connector-design.md`. This extends rather than replaces source-aware Learning Graph semantics or the consented PW observer.

## 1. Vision and approved product decisions

AIMERS is a student-controlled learning operating system. For verified **adults aged 18+ in the first pilot**, it combines device/app/browser observations, permitted learning-provider information, personal preparation goals, and academic evidence to produce honest behavioral metrics and a supportive AI Mentor. Collection and analysis should be automatic **after** the student grants the relevant AIMERS scopes and device/browser/third-party permissions.

The user approved: (a) detailed authorized cloud activity records, (b) a **proposed 365-day default** for detailed/raw activity retention, subject to legal necessity, shorter limits for especially sensitive categories, deletion choices, and safeguards, and (c) **continuous analysis** of authorized activity with strict permission and security controls.

**Continuous means event-driven analysis while monitoring is authorized, not perpetual unrestricted LLM access to all device data.** AI models must not receive irrelevant raw browsing records, messages, passwords, payment fields, cookies, authentication tokens, or intimate/private contents. Broad privacy agreement acceptance cannot bypass OS permissions. The adult pilot cannot be silently activated for users with missing or unverified age. Any under-18 feature set needs a separate child-specific legal and privacy design.

"Accurate" refers to traceable observed measures. Academic relevance, focus, motivation, intention, and mood may be ambiguous. Show inferred classifications with uncertainty and user correction; do not produce factual "dedication scores" or emotional diagnoses from app usage. Future exam-marks forecasts are separate, benchmarked models with uncertainty intervals.

## 2. Alternatives and selected strategy

**Rejected: raw full-context LLM processing of every event.** It is privacy-invasive, expensive, unreliable for counting, and exposes models to prompt injection through page titles, URLs and search snippets.

**Rejected: summaries calculated only once a day.** It limits the requested near-real-time interpretation and responsive guidance.

**Selected: continuous permission-gated event processing + deterministic metric aggregation + selective classification + bounded evidence retrieval for Mentor analysis.** The model can continuously analyze permitted detailed activity through scoped queued jobs, but it does not have broad standing credentials to the raw vault. Every request has a declared purpose and current permission check. Student-configured limits constrain processing frequency, data categories, and notifications.

## 3. Components and data flow

1. **Onboarding:** adult eligibility; user-selectable purpose scopes; platform/browser/OS permission steps; clear previews of collected fields, model processing, deletion, retention, and settings. Nothing activates merely from login or generic policy acceptance.
2. **Collecting agents:** Chrome/Edge extension, supported macOS/Windows agent, Android companion with explicit usage authorization, and iOS/iPadOS only through capabilities the operating system actually exposes. Approved learning-provider connectors are independent of OS collectors. No assumed coverage of all applications, private messages, or full social-media feeds.
3. **Consent/policy gateway:** validates authenticated account, device registration, per-source scopes, permitted fields, allowed domains, revocation, event timestamps and ingestion quotas. Reject invalid, unsupported, stale, mismatched or excessive events.
4. **Secure event bus:** idempotent ingest, encrypted transport, queue and bounded retries, out-of-order handling, dead-letter diagnostics, per-student access isolation, and replay protection. An interrupted device cannot transfer prior events to another logged-in account.
5. **Raw activity vault:** encrypted restricted payloads stored separately from normalized time/event metadata. Clear retention/expiry per record; strictly limited decryption and audit logs; sensitive sources excluded/redacted before upload.
6. **Deterministic analytics workers:** overlap-aware foreground/idle intervals, observed learning minutes, context switching, time allocation, planned-vs-observed study, activity coverage and freshness. Never sum duplicate observations from browser and desktop agent into fabricated double time.
7. **Classification workers:** identify educational relevance and category with calibrated labels, source context, model/rule version, ambiguity and human corrections. WhatsApp or browsing a country might be study-related; unknown stays unknown.
8. **Learning Graph bridge:** join confirmed source courses, lectures, source-to-exam concept mappings, completion evidence, pending and truly overdue work. Observed playback never automatically becomes provider-confirmed lecture completion.
9. **Behavior Intelligence:** computes explainable change-over-time signals; differentiates measured and inferred; avoids unvalidated psychological judgments, stigmatizing "wasted" labels and unverifiable productivity percentages.
10. **AI Mentor:** synthesizes evidence-backed observations and the student's stated study goals, plans and voluntarily reported mood. It can ask clarifications sparingly and suggest actions; it cannot authoritatively update raw observations, alter academic facts, diagnose mental-health conditions or take device-control actions without distinct permission.
11. **Student-facing controls:** at-a-glance dashboard, evidence drill-down, settings, pause, consent revocation, data correction, export and deletion. Prominently show active sources, latest sync, completeness and whether the Mentor has accessed detailed records.

## 4. Proposed data model

Reuse foundations found in Prisma: `StudentProfile`, `ConnectedDevice`, `DataConnector`, `ConsentGrant`, `PrivacyPreference`, `ActivityEvent`, `ActivitySession`, `DailyActivitySummary`, `BehaviorSignal`, `Intervention`, and the Learning Graph models. **Do not place unrestricted raw URLs or search queries into broadly readable metadata JSON.** The existing `PrivacyPreference` currently defaults to `rawRetentionDays=30`, `storeRawActivity=false`; the 365-day proposal requires separately reviewed onboarding/policy changes and explicit adult activation, never a silent change for existing users.

New normalized storage components (subject to schema review):
- `CollectorRegistration`: student/device/connector, collector version, credential and revocation state, active capability/scope map.
- `RawActivityRecord`: scoped unique event ID, actor/device/source, observation start/end, server receipt, event kind, quality level, field-level consent snapshot, retention deadline, protected payload reference.
- `SensitiveActivityPayload`: encrypted optional detailed URL/query/metadata with field filtering, key reference, purpose classification, deletion state and strict reader authorization.
- `NormalizedActivityInterval`: canonical time ranges across devices; overlap/idle attribution, unknown periods, correction provenance.
- `ActivityClassification`: category, academic relevance, confidence, model/ruleset version, reasons, student correction and correction timestamp.
- `BehaviorMetricSnapshot`: window, metric/formula version, source coverage, numerator/denominator, exclusions, computedAt, evidence links, precision/limits.
- `MentorAnalysisRun`: authorized declared purpose, allowed data categories, bounded raw record IDs or query filters, evidence links, execution and model/prompt version, cost and access audit.
- `UserMoodCheckIn`: explicit voluntary student report, timestamp and correction/deletion control; **not inferred mental-health diagnosis**.
- `RetentionDeletionJob`: TTL, vault/index/cache purge state, backup expiry/deletion design, user request history and legally required audit.
- `ExamForecast` (later): model version, training validity, held-out calibration, inputs and error range; **never** classified as measured.

All unique keys are tenant/student scoped. Student owns records; organization/mentor access is not inherited automatically and requires separately defined student permissions and role policy. Sensitive payloads cannot be returned by generic activity APIs.

## 5. Consent, security and privacy policies

Per-source, per-purpose control examples: `APP_USAGE`, `BROWSER_ACTIVITY`, `BROWSER_HISTORY_IMPORT`, `LECTURE_PROGRESS`, `CROSS_DEVICE_SYNC`, `BEHAVIOR_ANALYSIS`, `AI_CONTEXT_SHARING`. Full URL retention and other detailed data categories must have separately scoped switches beyond general behavior analysis; explicitly distinguish historic imports from future monitoring and normal activity categories from raw search strings.

**Three independent checks are required:** (1) onboarding explicit opt-in, (2) OS/browser/provider permission granted, and (3) valid server-side consent checked **at ingestion and at every processing/retrieval stage**, including during queued work and a model invocation. On pause/revocation, immediately stop new collection/upload/processing for the scope, revoke collector privileges, invalidate in-flight AI contexts where possible, and apply user-requested delete/retention actions.

Encryption in transit and at rest, application-layer protection of sensitive details, managed keys and rotation, tenant access isolation, audited privileged access, environment segregation, security testing and incident procedures are mandatory. Raw content used as classification input remains untrusted prompt-injection data and must not control system instructions or tools. Never copy raw detailed records into ordinary logs, analytics SaaS, error reporting, or unrestricted model provider requests. Third-party inference requires explicit disclosure, contracted processing limits and no unauthorized training use.

**Retention:** proposed adult-pilot default is 365 days from collection for authorized detailed activity; enable earlier deletion, expiration checks, shorter periods where necessary, and protection of backups/caches/export artifacts. Retain derived statistics only under separately authorized, disclosed retention and delete/correction controls. Retention is not continuous consent.

## 6. Measurement and classification semantics

**Measured with provenance:** device/application foreground intervals, supported website intervals, permitted lecture-playing time, event counts, known interruptions, and overlap-adjusted study time. Report measurement coverage, clock synchronization and whether a device had usable access. Missing data ≠ zero activity. Two simultaneous app sessions on different devices can both be observed; unique person-time must avoid naïve addition and admit uncertainty if device attention cannot be resolved.

**Context-classified with calibrated uncertainty:** likely academic browsing, exam research, leisure categories, cross-app switching likely relevant to studying. Avoid labeling Instagram, WhatsApp, country searches, news or YouTube as 'waste' without context. Unknown remains unknown; a student can correct classification.

**Self-reported:** mood, fatigue, learning intent, personal study completion and commitments. Do not infer moods, addiction, disorders, personality or dedication as fact from passive device telemetry.

**Predicted:** optional future exam-mark estimates, never treated as activity facts. Require validated historical academic results, calibration, explicit limitations and range of uncertainty. Until validated, do not display numerical predictive marks.

Academic preparation metrics and provider backlog must use the separate Learning Graph's source-preserving, evidence-based completion model. A student marking a lecture complete and a provider reporting incomplete remain separate conflicting assertions until reviewed.

## 7. Mentor operating boundaries

Support three bounded types of continuous operation:
- **Streaming analytics** update objective metrics on valid ingested events without generating an LLM response for each event.
- **Scheduled incremental model reviews** receive only allowed, policy-filtered relevant details, with deduplication, rate caps and per-student budgets.
- **User-requested depth analysis** may retrieve additional authorized details under an auditable, purpose-specific context request and strict limits.

Mentor recommendations contain: clear action, evidence citation to internal event/metric/lecture IDs, freshness, confidence, and an option for correction or dismissal. The LLM cannot decide or fabricate counters; it quotes service-calculated values. Nudges are rate-limited, non-shaming and optionally disabled. No automatic app blocking or account actions without separate explicit control authorization. Psychological claims require student self-report and must remain non-diagnostic.

## 8. User experience

Onboarding: verified 18+, explain collector coverage and permissions, opt into permitted categories, connect device and browser extension, optionally import history, choose raw data retention, activate; subsequent permitted operation automatic. A connection dashboard explicitly says what AIMERS **cannot** see.

Compact home cards:
- **My Learning:** exact connected source and provider-backed lecture metadata where supported; activity metrics, completion state, source freshness.
- **My Preparation:** observed study time with known measurement coverage, pending and overdue from real deadlines, unresolved evidence conflicts, exam coverage and one Mentor suggestion.
Detailed tabs provide: Behavioral Intelligence trends, Activity Explorer with redactions/corrections, Study Plan, Learning Graph, Privacy/Data Access Log, and AI Mentor.

UI must visibly label measured, classified, student-reported and forecast data; low-confidence evidence remains labeled. Do not use generic productivity/dedication percentage or emotion readings as hard facts.

## 9. Operational safeguards and acceptance criteria

Cases to test before release:
- no access to an unapproved category even when site permission exists; paused/revoked account has no new ingestion or model jobs;
- wrong student/device/connector identity cannot send or read events; logging and 3rd-party model payloads contain no raw secrets;
- duplicate, reordered, delayed or offline queued events do not double count, regress cumulative counters or leak between accounts;
- overlapping Chrome/desktop observations do not inflate study time; partial/inactive device periods disclose measurement coverage;
- WhatsApp/Instagram remain unknown without supporting context; student-corrected labels update future projections but preserve observation provenance;
- generic lecture title cannot be mapped to fake chapter; no video playback alone means authoritative completion;
- user deletion/TTL removes vault data and associated search/cache representations per documented deletion guarantees;
- timeout, cost budget or classifier outage leaves useful deterministic dashboard metrics, with delayed-analysis indication rather than fabricated analysis;
- activity classifier and mentor pass adversarial prompt-injection tests from webpage titles, URLs and text;
- age verification rejects minors and missing DOB from the adult monitoring pilot;
- AI Mentor shows supporting evidence and abstains from mood/mark claims where unverified.

## 10. Implementation phases — future plan, not authorized by this spec alone

Phase 0: inspect local worktree and protect uncommitted PW two-host normalization/sync patches; establish current behavior and tests.
Phase 1: adult onboarding, precise consent, collector identity, scoped event ingestion, evidence tagging and controlled raw vault.
Phase 2: stable browser/desktop observation and overlap-aware calculation; initial truthful day/week dashboard.
Phase 3: Android and other OS connectors where available; stronger coverage reporting and device controls.
Phase 4: contextual classifications, student correction loop, model measurement/calibration, audit logs and bounded continuous analysis.
Phase 5: connect to Learning Graph and Mentor; purpose-limited raw-context retrieval, non-coercive guidance, validation and budgets.
Phase 6: optional exam-forecast model if high-quality assessment data and evaluation justify it.

**No implementation, code migrations, permission changes or production behavior are covered by this document.**

## 11. Scope split and explicit unresolved policy items

This subsystem is independent from provider curriculum acquisition and from the separate exam forecast. Before code implementation: approve the spec; then write a detailed implementation plan. Validate privacy/legal requirements, collector/platform constraints, retention, sensitive-category exclusions, model vendor contracts, alert thresholds, budget and support process.

The existing adult-only PW account-sync pilot remains the baseline; do not assume new browser permissions or fully working cross-device collector capability are already available.
