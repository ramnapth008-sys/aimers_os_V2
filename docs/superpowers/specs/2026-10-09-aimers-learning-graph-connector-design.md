# AIMERS OS Learning Graph & Platform Connector Engine — Architecture Design

**Status:** Design specification for human review; not an implementation or a claim of platform compatibility.  
**Date:** 2026-10-09  
**Scope:** External source curricula, consented course discovery, normalized lecture identity, AI-assisted concept linking, evidence-based completion, pending/overdue calculations, and a compact student interface.  
**Starting point:** Existing PW Chrome lecture observer, local web-to-extension bridge, authenticated lecture-progress API and Prisma schema. The user's local PW synchronization worktree may have uncommitted changes absent from the reference GitHub branch; implementation must inspect and protect those changes.

## 1. Product intent and non-goals

AIMERS is a preparation operating layer, **not a replacement teaching platform or a competing mandatory syllabus**. Students retain the learning platform they choose (e.g. PW, Vedantu, YouTube) and AIMERS follows each provider's permitted, original syllabus, course structure, lecture sequence, and schedules. AIMERS separately maintains a **versioned exam competency reference** for aggregate exam coverage and assessment; it never renames source chapters or treats the exam reference as a student's enrolled learning content.

Success means: the student can grant source-specific permissions; review and confirm automatically discovered courses; see the actual provider/batch/subject/chapter/topic/lecture when reliably available; retain observed play metrics; view pending work separately from genuinely overdue work; distinguish lecture completion from concept mastery; and receive one useful, evidence-grounded next action. The student home screen retains two compact cards (My Learning and My Preparation). Detailed views hold the rest.

Non-goals for the initial phase: scraping protected content, bypassing DRM or platform restrictions, inferring a full private course catalog from a single playback page, monitoring unrelated sites or messages, installing permissions silently, producing verified completion solely from playback, substituting guessed deadlines, or silently enabling tracking for minors. Mobile and OS-level capability are explicitly separate follow-ups, not magically inherited from a browser extension.

## 2. Architectural approaches and decision

Alternatives considered:
1. Provider APIs only — strong reliability and authorization semantics, but unavailable for many platforms.
2. Browser observation only — integrates the current PW pilot rapidly but is fragile, often lacks private batch schedules or stable lecture identifiers, and cannot cover arbitrary mobile apps.
3. **Selected: capability-based hybrid** — prioritize official APIs/authorized exports; use explicit permission-scoped on-page metadata on supported pages; use student-confirmed imports/edits where metadata is unavailable. All methods emit the same normalized schema with source/provenance labels.

Adapters are independent of matching, aggregation, and account identity. An adapter cannot arbitrarily update exam readiness or approve its own source permission. A capability declaration reports what it can actually provide, with last verified timestamp and completeness: COURSE_DISCOVERY, ENROLLMENT_EVIDENCE, CURRICULUM, LECTURE_IDENTITY, SCHEDULE, DEADLINE, PROVIDER_COMPLETION, PLAYBACK_OBSERVATION. Missing capability is recorded as unavailable, never treated as an empty result.

## 3. End-to-end data flow

1. Student deliberately connects a provider and approves narrow, provider-specific scopes using the existing consent/privacy system plus provider/site permissions. Existing minor protections remain enforced; external monitoring pilot remains adult-only until an age-appropriate dedicated flow is implemented.
2. Adapter discovers permitted **candidate** courses; no candidate is tracked as an enrolled course yet.
3. Student confirms the courses they follow. Excluded courses cannot enter monitoring or backlog aggregation by default. Subsequent course structure changes within the approved scope synchronize without per-lecture popups.
4. Adapter synchronizes a versioned provider curriculum graph, lecture identity and any exposed timing/completion metadata. Store external IDs and original labels as source facts; local database UUIDs are implementation keys. Never store full private URLs unless separately permitted; prefer minimal stable identifiers with provider prefix. Scope imported metadata to the student's account, provider, and confirmed course.
5. On supported watch pages, collector measures separate **viewing sessions** (stable random session ID) and links to a stable provider lecture ID if and only if evidence supports identity. Multiple watches of one lecture are multiple sessions, not multiple lectures.
6. Matching service proposes source-node → exam-competency associations. Calibrated confidence and explicit evidence gates drive AUTO_LINK, NEEDS_CONFIRMATION, or UNMATCHED. Persist mapping version, reason, model version, and corrections.
7. Evidence engine combines provider reports and student declarations without overwriting originals. Backlog engine derives pending/overdue states with provenance and timestamp semantics. Read models power My Learning, My Preparation, detailed Learning History, and the AI Mentor.
8. Revocation/pausing stops new collection, metadata retrieval and upload for the affected scope. Stored data follows user-controlled review/deletion and explicit retention policies.

## 4. Core entity boundaries

Use the existing `DataConnector`, `LectureSession`, activity and consent models as integration foundations, but **do not overload `LectureSession` as provider catalog + lecture + playback session + completion evidence**. Schema changes require a separately reviewed migration in implementation.

- `LearningProvider`: normalized provider code, allowed domains, supported capabilities, policy information and adapter version.
- `SourceConnection`: student, provider, auth/permission method, allowed scopes, state, last sync and errors; link to `DataConnector`.
- `DiscoveredCourse`: candidate provider course/batch ID and original title; discovery evidence; not automatically enrolled.
- `FollowedSourceCourse`: student's explicit confirmation, source course identity, follow state, exam association and timestamps.
- `SourceCurriculumNode`: student/source/course-scoped stable external ID, type (subject/unit/chapter/topic/lecture/playlist/other), original label, optional parent, sequence and version. Do not force providers into all levels; allow optional/unknown hierarchy and many-to-one groupings.
- `SourceLecture`: canonical provider lecture identity (or unresolved provisional identity), course reference, availability, required/optional status, duration, source schedule/deadline with timezone, and confidence/provenance.
- `LectureObservation`: immutable event/session identity and monotonic play-time counters, elapsed time, position (may move backwards), pauses, rewinds, observed playback state and receipt time. Prevent duplicate events and stale snapshots; source session ID must be scoped by student + provider + connector.
- `LectureCompletionEvidence`: append-only factual assertion: PROVIDER_CONFIRMED_COMPLETE, PROVIDER_REPORTED_INCOMPLETE, STUDENT_DECLARED_COMPLETE, STUDENT_WITHDREW_DECLARATION (and metadata), explicit origin and observed/effective timestamps. Provider source snapshots are not student declarations.
- `LectureStatusProjection`: derived, reproducible state, computed from the evidence stream and course requirements. A cache/materialized view is possible, but never the only evidence.
- `ExamCompetency`: versioned official-exam reference concept; not a teaching syllabus or lecture source.
- `ConceptMapping`: association between source nodes and exam competencies, provider and course scope, evidence, model version, calibrated confidence, status AUTO_LINKED / STUDENT_CONFIRMED / NEEDS_REVIEW / UNMATCHED / REJECTED, correction provenance, revision history.
- `SourceSyncCheckpoint`: source catalog/schedule/completion sync cursors and last successful range; freshness, completeness and errors.

Relational constraints: unique canonical lecture key (student, provider, followed course, external lecture ID); session key independent of lecture identity; unique provider-node identity within course and version; explicit tenant ownership checks on every read/write. Where no trustworthy ID exists, keep the session unmatched and offer confirmation rather than title-based cross-course deduplication.

## 5. Lecture identity and playback semantics

Distinct measures: video total length; elapsed wall-clock session time; actively playing time; current playback position; pause count; rewind/seek count; unique watched time ranges **only if timestamp interval coverage can actually be determined**. Rewatching the same range adds playing effort but not distinct content coverage. Playing time can exceed lecture length. A seek changes position but does not imply skipped material was learned. Pause/rewind measurements are behavioral observations, not judgments about learning quality.

Track auto-collection only on source sites the student approved. The PW prototype's single locally stored summary is insufficient for lossless offline history; the implementation plan must address persisted event batches/outbox, bounded local retention, idempotent upload and client acknowledgement **without granting the extension the website's auth token**. Until a secure paired upload mechanism exists, account uploads require the signed-in AIMERS site to be open. Disconnect/account switching stops uploads immediately; snapshots from a prior account/connection are not reassigned to another account. Server checks age eligibility, active consent, identity, ordering, and bounded counters.

## 6. Completion, conflicts and backlog state machine

**Accepted policy:** prefer provider-confirmed completion when available; when absent, allow explicit student self-reported completion, clearly labeled. **Never** infer authoritative completion from mere playback, including 100% playback.

Keep provider status and student status as **separate independent fields**. Conflict example: student claims complete; provider later reports incomplete. Preserve both time-stamped claims, set `completionReview=CONFLICT`, and surface a lightweight review action. Do not silently overwrite either value. If the student withdraws their declaration, append a reversal; never mutate the original assertion. Provider may update its own report, also as a new evidence record.

Derived student-facing state:
- Provider confirms complete → `COMPLETED_PROVIDER`; history retains any earlier conflicting evidence for audit.
- Provider has no completion signal + student explicitly confirms → `COMPLETED_SELF_REPORTED`.
- Provider currently says incomplete + student says complete → `NEEDS_REVIEW`, **not silently marked complete nor silently returned as ordinary overdue**.
- Neither confirms → `INCOMPLETE_OR_UNKNOWN` depending on coverage and required-status evidence.
- Only a video observation → `OBSERVED_ONLY` (not a completion signal).

Backlog uses selected **required** source lectures only. `pending` includes available, required, not acknowledged-complete lectures; `overdue` is a subset of pending with a known, passed deadline, flagged `PROVIDER_DEADLINE` or `STUDENT_PLAN_DEADLINE`. No reliable deadline → cannot be overdue. Provider deadlines must be associated with time zone and source. A changed deadline is versioned and projection recalculated. Separate `needs review` count excludes unresolved conflicts from a misleading certain pending/overdue total; detail shows that the provider's pending assertion still exists. Show “partial coverage” / “schedule unavailable” when catalog completeness is unknown. Do not conflate provider pending commitments and exam competency gaps.

The two-card UI should show compact **Pending**, **Overdue**, and **Needs review** counts with labels, timestamp freshness, and one optional next action. Avoid alarming language and comparison-based shaming.

## 7. AI matching behavior and safeguards

Before semantic matching, confirm provider context and source node availability. Generate candidates using provider naming/hierarchy, language variants, lecture metadata, authorized references, and exam competency map. Hard constraints forbid cross-subject accidental mappings where evidence conflicts. LLM text-only similarity is not sufficient for high-confidence linking. Calibrate probabilities on a labeled, representative dataset per connector/exam, measure precision, review disagreement/false positive rates and perform regression tests on synonym/near-miss sets.

**Provisional decision thresholds, subject to validation:** AUTO_LINK at calibrated >=0.95 *and* required evidence gates; NEEDS_CONFIRMATION for 0.70–0.95 or ambiguous alternatives; UNMATCHED below 0.70/insufficient metadata. No model score alone may convert a generic title like “PW Video Player” into a named chapter. Auto-links are reversible, auditable and can be corrected by a student. Cross-platform matching never mutates original node names or claims lecture completion. Exam coverage deduplicates equivalent competencies, not provider lecture obligations; assessed mastery uses practice/test outcomes, not observed video time.

## 8. Connector error handling, security and privacy

Use adapter isolation with a minimum-permission policy, explicit site/connector allowlists, rate limits, backoff, freshness labels, and per-connector error surfaces. PW may expose accessible HTML5 playback without offering its authenticated batch hierarchy through an authorized interface; in that case show observed lecture activity and mark hierarchy UNKNOWN. The architecture does not assume API partnerships exist, reverse-engineer private APIs, bypass DRM, defeat bot protections, or silently install browser/mobile permissions.

Cache invalidation/sync revisions handle renamed nodes, reordered lecture listings, missing/deleted content and duplicate IDs. Provider absence or a failing fetch is “not synchronized,” **not** “no remaining lectures”. Dedupe retries by student/provider/course/event key; ensure out-of-order data cannot decrease accumulated watched effort.

No raw URL/history/social media collection is authorized by this feature. Personal data is available only to the authorized student/account and approved roles, with consent/revocation and deletion controls; preserve required audit and deletion obligations. Cross-device visibility means server-held account records, not surveillance of devices without per-device permissions. Stronger safeguards and a legally reviewed guardian flow are prerequisites for minors. Provider-specific permission must be independent from AIMERS account consent.

## 9. Read models and experiences

**My Learning (home card):** actual provider, followed course/batch, subject/chapter/topic and lecture **only if sourced or student-confirmed**; video length, playing time, elapsed, pause/rewind, live/saved state, last sync and source identity confidence. If metadata unknown, visibly say “Chapter not identified” and allow review; never substitute an AIMERS-recommended chapter.

**My Preparation (home card):** pending count, included overdue count, separate conflicts needing review, broad exam competency coverage and one grounded next action. No synthetic backlog deadlines, unverified mastery percentages, or duplicate cross-platform counts. More information sits in provider course detail, learning history and unified exam-progress pages.

**AI mentor:** advice cites evidence: “PW Redox lecture recorded; matching to exam concept confirmed; completion self-reported; practice has not yet been assessed.” Advice is opt-in, contextual and non-coercive.

## 10. Operational phases and acceptance tests

- **Phase 0: Protect existing work.** Inspect actual local working tree (which may differ from the GitHub reference); preserve uncommitted PW hostname normalization/sync fixes; run regression tests and record baseline.
- **Phase 1: Stable source lecture IDs.** Persist multi-session observations and source metadata separately, bounded local outbox; do not regress working PW measurements/account pairing.
- **Phase 2: Course discovery & confirmation.** Constrained supported-course discovery, student approval, source-node snapshots with provenance; make unsupported provider capabilities explicit.
- **Phase 3: Completion evidence and backlog projection.** Provider event ingestion (where actually available), self-report/withdrawal UI, conflict resolution, deadline handling, partial-coverage status.
- **Phase 4: AI concept matching.** Calibrated candidate generation, automatic high-confidence links, student review and reversible mappings, versioned exam reference.
- **Phase 5: Expand adapters.** Additional web platforms, exports, then mobile/desktop conditional on consent, official platform capabilities and legal review.

Acceptance cases: one lecture watched multiple times yields one source lecture and several playback sessions; backward seeks preserve current position while play effort remains monotonic; student self-report and provider incomplete yield a review state without discarding either; pending 6 with overdue 2 displays 6 pending / 2 overdue, not 8; absence of deadline yields no fabricated overdue; absent catalog yields partial/unknown count, not zero; two providers teaching one competency do not inflate unified exam coverage; generic PW title remains unmatched; revoked consent stops collection/uploads; logout/account switch cannot leak data; cross-device read returns owned, saved records only; browser failures do not erase existing evidence.

Performance goals for the **current live PW prototype** (not guarantees for all future sources): update source dashboard within approximately 5 seconds and refresh other visible signed-in dashboards within 10 seconds under normal network conditions; display disconnected/pending rather than falsely claiming successful sync.

## 11. Known constraints and delivery boundary

Reference code has `LectureSession` with nullable subject/chapter/topic IDs, a single metadata JSON field and observed confidence, and `DataConnector` with permissions, status and sync cursors. These are foundations, not a provider-specific curriculum catalog. Reference browser manifest currently names only one PW hostname; the user's described local work includes an uncommitted two-host normalization fix, **not represented by this committed GitHub reference**. Never overwrite or “restore” that local patch while implementing.

No product code is modified by this specification. Database schema, API contracts, extension behavior, tests, data migration, UI and secure sync are separate implementation-phase approvals. No current capability to automatically access any provider's complete private syllabus is claimed.

## 12. Design decisions agreed with user

1. Keep each provider's original syllabus and also show unified exam progress.
2. Automatically discover supported courses; student confirms which courses they follow.
3. AI-assisted concept matching; automatically accept only calibrated high-confidence matches; request student confirmation when uncertain.
4. Track available **pending lectures** and deadline-backed **overdue backlogs** separately; never invent deadlines.
5. Provider-confirmed completion preferred; clearly labeled self-reported completion allowed where provider confirmation is unavailable. Playback alone does not complete.
6. Preserve both provider and student completion evidence when they disagree, flag discrepancy for review and never silently overwrite either.
7. Minimal, student-friendly home screen and clear privacy/consent control, with advanced analysis in dedicated pages.
