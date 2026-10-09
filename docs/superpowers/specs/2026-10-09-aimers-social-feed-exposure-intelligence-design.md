# AIMERS OS — Social Feed Exposure Intelligence Architecture

**Status:** Design for user review; no application code or schema migrations authorized.
**Date:** 2026-10-09
**Documents built upon:** `2026-10-09-aimers-behavior-intelligence-continuous-ai-design.md` and `2026-10-09-aimers-learning-graph-connector-design.md` on the same documentation branch.
**Audience:** Architecture, backend, browser/mobile, ML, security, privacy, product QA.
**Rollout:** Verified adults (18+) first. A future minor-facing design must undergo separate legal, platform and child-safety review.

## 1. User vision, outcomes and acceptance boundaries

AIMERS should provide more than app screen time. With detailed, revocable user authorization **and technically and contractually permitted access**, it should characterize the social *content a student actually encounters*: categories and themes, potential harassment and hate, explicit threatening material, repeated sensational claims, academic relevance, diversity of content, and what types of exposure coincide with the student's planned studying. It should combine these results with the existing Learning Graph and Behavior Intelligence while avoiding unsupported claims about the person's character, "mind toxicity", disorder, or mood.

**Approved architecture approach:** hybrid and progressive. Official provider integrations and authorized exports where available; specifically disclosed, supported browser-page inspection only where platform policies and browser permissions allow; separately student-shared content or supported imports as fallback; application usage metadata without feed content where that is all the operating system permits. Do not claim a mobile app-usage permission reveals the actual native social feed.

**Expected outcome:** adult student can opt into supported platforms and content categories, see what was observed and what was not, get calibrated content-exposure reports with sample-size and coverage disclosures, correct false classifications, and receive supportive Mentor recommendations grounded in real evidence. Post/login or privacy acceptance **cannot** grant unrestricted access. Tracking is automatic only after necessary app/platform/OS grants and scope-specific consent.

**Out of scope:** covert screenshots or screen recording, keylogging, intercepting private chats or direct messages, harvesting another person's private activity, circumventing authentication/DRM/anti-bot restrictions, unauthorized automated feed scraping, inferring mood/mental health/toxicity of a person from content without direct evidence, automated user-level judgments about dedication or fitness for study, and claiming complete feed exposure when only a sample is accessible.

## 2. Feasibility and capability matrix

Every provider adapter reports `APP_USAGE`, `BROWSER_PAGE_CONTENT`, `AUTHORIZED_POST_EXPORT`, `SELF_SHARED_ITEM`, `EXPOSURE_INTERVALS`, `FEED_SCROLL_POSITION`, `MEDIA_CAPTIONS`, `MEDIA_FRAMES`, `AUDIO_TRANSCRIPT` as capability flags with availability and precise permission/policy basis. **Flags are FALSE until validated**; a provider's general API presence does not imply it grants an ordinary consumer's personalized feed.

| Surface | What may be supportable | What must not be presumed |
|---|---|---|
| Supported social website in approved browser | User-visible authorized metadata/text on permitted pages, page activity, contextual navigation | Full algorithmic personalized feed, all posts viewed, private DMs, hidden or cross-origin iframe content, right to scrape |
| Official provider OAuth/API or export | Specifically documented endpoints, user-owned information and contractual/permission-scoped fields | Cross-provider access, consumer home feed or private recommendation logs unless expressly supported |
| Android app usage permission | Supported app foreground activity/time | Native Instagram/TikTok feed captions, individual reels, DMs, visual contents |
| iOS/iPadOS Screen Time-related APIs | Restricted authorized app and website activity measures on supported entitlements | Full native-app feed or general detailed browsing content |
| Explicit user-shared content | Post links, captions, excerpts, screenshots, exported permitted content | That shared sample represents the entire feed or an exact historical view |
| Provider partnership (future) | Contractually approved user-content/activity fields | Data outside terms of the partnership |

Adapters have a provider policy/capability registry reviewed prior to enabling production. Deny unknown platforms by default. Do not abuse accessibility APIs or emulate interaction to bypass provider limits. Unsupported collection is marked `UNAVAILABLE_PLATFORM_RESTRICTED` not `ZERO_CONTENT`.

## 3. System context and trusted pipeline

```text
Student's explicit source and processing choices
    ↓
Consent scopes + provider/OS permissions + 18+ verification
    ↓
Approved source adapters (usage / permitted page / provider API / student share)
    ↓
Local exclusion filter, data minimization, page-domain and record-type allowlists
    ↓
Authenticated collector → consent gateway → scoped event bus
    ↓
Encrypted exposure metadata and protected optional content vault
    ↓
Normalizer + identity/dedupe + evidence coverage estimator
    ↓
Specialized content classifiers + quality context + uncertainty calibration
    ↓
Exposure metrics (deterministic) + corrections + evidence provenance
    ↓
Behavior Intelligence & Learning Graph (separate factual models)
    ↓
AI Mentor purpose-bound analysis → user-visible report and review controls
```

The collector is an eye, not an autonomous AI agent. A feed content string is untrusted data; it cannot update AIMERS prompts/policies, request tool invocations or initiate account/device actions. Sensitive content never appears in generic logs or a third-party model by accident.

## 4. Collector, session and exposure semantics

### 4.1 Supported web collector behavior

Supported web extension (distinct from stable PW lecture tracker until safely integrated) activates only for approved origins and after domain-level and category-level permission. Observe **only accessible, actually rendered and legally/technically permitted content**. Respect visibility, foreground state, application idle and page navigation. Capture allowed post IDs/URLs, visible text/caption or coarse metadata where authorized, author/page metadata only if needed and permitted, and limited visibility intervals if measurable. Content outside viewport or in a prerendered/infinite-scroll buffer **is not exposure evidence**. A rendered item is not proof it was read or believed.

Only use permitted structured data or visible elements; do not extract hidden private APIs, cross-origin private frames or secure areas. A provider-specific adapter must declare version, selectors/metadata expectations, tested page variants, supported languages and failure states. Dynamic feed updates require safe, bounded observation and deduplication. Browser extensions must comply with applicable web-store disclosure, minimum permission, data use and review requirements.

### 4.2 Exposure levels and missingness

`USAGE_ONLY`: application/session duration is available, but content is unknown.
`PAGE_OBSERVED`: page/category visible; individual feed items may be unknown.
`ITEM_RENDERED`: specific item was rendered with permitted content signal.
`ITEM_VISIBLE_DURATION`: item visibility interval supported by collector; engagement/attention **not** confirmed.
`USER_INTERACTED`: explicit supported action or self-report; no inference of agreement with the content.
`USER_SHARED`: user voluntarily provided content; not automatically part of observed feed history.

For each coverage window persist observed eligible duration, actual content-item capture duration/sample size, unknown or unsupported interval, and completeness status. Denominator for content distributions is always **classifiable sampled items** or **measured visible-item intervals**, never total screen time unless the denominator truly supports that claim. Report post mix and exposure duration separately.

### 4.3 Avoid duplicates and inflated exposure

Deduplicate source item observations by `student + provider + sourceAccount (if available) + normalizedExternalItemId + observationSessionId`; weak identifiers remain tentative and must not merge unrelated posts. Repeat appearances may count as repeat exposures but not distinct items. Overlapping browser and desktop app observations must not count person-time twice. Background tabs, paused browser, offline/clock skew, cross-device concurrency and page visibility loss become explicit measurement limitations.

## 5. Candidate schema / database contracts

Build upon existing `DataConnector`, `ConnectedDevice`, `ConsentGrant`, `PrivacyPreference`, `ActivityEvent`, `BehaviorSignal`, `DailyActivitySummary`, and the companion secure activity vault. Proposed separate models (naming may adjust after architecture review):

- `SocialSourceConnection`: student ID, provider type, adapter version, allowed origin/account binding, verified scopes, platform/legal compatibility, health/freshness.
- `SocialCollectionPolicy`: student/provider/content-category scope, raw details allowed, opted-in timestamps, retention, pause/revocation and permission references; immutable policy revision.
- `FeedObservationSession`: source session ID, device ID, start/end, visibility/foreground status, coverage quality, sync/clock metadata.
- `FeedItemIdentity`: provider-scoped stable ID or tentative ephemeral key, source/canonical URI (only if allowed), immutable source provenance; optional item hierarchy.
- `FeedExposureEvent`: observer session, item ref (nullable), exposure level, event kind `RENDERED|VISIBLE_START|VISIBLE_END|USER_INTERACTION|USER_SHARED`, timestamps, measured visible duration if defensible, and collection evidence/capability.
- `ProtectedFeedContent`: encrypted allowed caption/post text and narrowly scoped optional thumbnails/media-derived representations; never copied into generic metadata JSON; sensitive filter states, cryptographic key reference and TTL. Default raw image/video collection **off**.
- `ContentSafetyClassification`: taxonomy/version, localized language, labels with calibrated confidence, context warnings, model/prompt/version, evidence checksum, timestamp, `CLASSIFIED|UNCERTAIN|INSUFFICIENT|BLOCKED`.
- `ContentQualityClassification`: topic, education relevance, perceived informational value indicators, evidence, model uncertainty, student preference context; do not encode moral rank of person's character.
- `FeedExposureSummary`: window/timezone/source, eligible and observed coverage, sample counts, distinct/repeated items, exposure intervals, content label counts, confidence and lastUpdated.
- `ClassificationFeedback`: student confirmation/rejection/abstention with corrections and source reference; preserve original model output for audit.
- `SocialMentorInsight`: generatedAt, evidence/summary IDs, affected preparation goal, interpretation vs verified fact, suggestions, audit authorizations and user dismissal.
- `SocialDataAccessAudit`: actor/processing service, purpose, source scopes, record set IDs, granted policy, decision, cost and timestamp.
- `FeedRetentionDeletionTask`: record expiry, caches/search/vector embeddings/model-context purge state and backup-retention window.

Sensitive social data requires scoped DB privileges and per-student tenant checks; don't return encrypted content payloads through routine behavior dashboard endpoints. Provider's original post contents and third parties' personal information should not be retained unless absolutely necessary and specifically lawful.

## 6. Contract and API boundaries (design candidates)

Use NestJS `/api/v1` authenticated student routes and service-to-service collector credentials. Split event ingestion from privileged raw-detail APIs.

`GET /social/capabilities`: available sources, supported fields, permission requirements, and limitations (server policy + client capabilities).
`GET /social/consent`, `PUT /social/consent`: granular opt-in/off for provider, purpose and sensitive content categories; existing consent system remains source of truth.
`POST /social/observations/batch`: idempotent bounded event envelopes; schema version, source identity, device and session references, signed authenticated user context, coverage and event time. Never grant auth-token reading to an arbitrary content script.
`POST /social/content/authorized`: separate privilege path for optional raw detail with explicit policy/rights checks and size caps; off by default.
`POST /social/shared-items`: user-initiated sharing/import, clearly marked not actual observed history.
`GET /social/exposure/overview?from=&to=&provider=`: aggregate counts with source/sampling limitations.
`GET /social/exposure/items`: authorized redacted evidence with pagination and user control.
`POST /social/classifications/:id/feedback`: student correction.
`GET /social/insights`: evidence-grounded Mentor conclusions.
`POST /social/pause`, `POST /social/revoke`, `POST /social/delete`, `GET /social/access-log`: privacy operations.
`GET /social/sync-status`: last provider/page/device sync, capabilities and errors.

Ingest schema envelope concept:
```json
{
  "schemaVersion": 1,
  "connectorId": "registered-connector-id",
  "sessionId": "uuid",
  "events": [{
    "eventId": "uuid",
    "provider": "instagram-web-example",
    "capability": "ITEM_RENDERED",
    "occurredAt": "ISO-8601",
    "itemId": "provider-scoped-id-if-observed",
    "visibilityEvidence": "rendered-not-read",
    "contentPayloadRef": null
  }]
}
```
The server validates that these fields truly come from a compatible authorized collector; timestamps and event IDs are not considered authenticity proof by themselves. Distinguish client-observed vs independently provider-verified evidence.

## 7. Content and feed quality taxonomy

Multilabel, non-exclusive taxonomy with explicit definitions and language/locale:
- Content themes: academic study, science/technology, career, current affairs, sports, entertainment, marketing, civic/political, unknown.
- Risk-oriented content indicators: direct threats, harassment/bullying, identity-directed hate, sexual harassment, coercion/exploitation cues, violent/gory material, explicit self-harm advocacy (without storing details unnecessarily), scams/manipulation and unknown.
- Context flags: quotation, counterspeech, educational discussion, satire, ambiguous target, third-party re-share.
- Quality dimensions: user-goal relevance, checkable factual claims, repetitive/sensational framing, information provenance (when supportable), commercial promotion density, topic diversity.
- Emotional valence (content only, if validated): positive/negative/neutral/ambiguous, not a judgment about the viewer's feelings.

**No scalar "mind toxicity" or moral "feed quality" score as an objective truth.** If a high-level feed risk summary is built, present its precise underlying label definitions, denominators, unknown proportion, confidence intervals and evidence examples, making clear it is **risk indicators among the observed sample**. Different kinds of harm may not be safely represented by a single score. A news report quoting a threat is not automatically threatening the viewer.

## 8. Model architecture and evaluation

Use a layered pipeline:
- deterministic parser/language detection and provider-specific field normalization,
- lightweight multilingual text classification and pre-trained safety models as candidate baseline,
- optional specialized multimodal classification **only on explicitly authorized, accessible** image/video frames or captions (media capture not on by default),
- contextual LLM adjudication for ambiguous cases with untrusted-content isolation and strict budgets, never for counting exposure events,
- calibrated uncertainty/abstention and auditable student-feedback review,
- non-diagnostic AI Mentor over *authorized classified summaries and purpose-specific evidence*, not unrestricted third-party feeds.

Do not assume model confidence equals a calibrated probability. Train/evaluate on genuinely permissioned, human-labeled multilingual sample sets; license provenance and minimize retaining third-party content. Include Malayalam/English/Hindi/Tamil/code-switched examples and domain-specific education/harassment satire cases. Evaluate per language and platform: precision/recall for each harm class, false accusation rates, uncertainty calibration, abstention, stability under adversarial slang/sarcasm, demographic/identity-group fairness, and student correction frequency. Define production go/no-go thresholds from a labeled validation study, not invented percentages. Mark unsupported languages or media as unclassified.

Models do not infer a person's psychiatric diagnosis, mood, mindset toxicity, dedication, moral character, or exposure causality from feed labels. Optional student self-reported check-ins can be analyzed separately without medical claims.

## 9. Security, privacy, permissions and platform rules

Existing `ConsentScope` values cover broad activity and AI processing, but source feed content needs additional **explicit versioned scope definitions**: e.g. `SOCIAL_APP_USAGE`, `SOCIAL_FEED_CONTENT`, `SOCIAL_CONTENT_CLOUD_STORAGE`, `SOCIAL_AI_ANALYSIS`, `SOCIAL_USER_SHARED_IMPORT`, and optional `SOCIAL_MEDIA_FRAMES`; determine exact DB enum vs fine-grained policy table in implementation planning. Do not automatically enable these because `BROWSER_ACTIVITY` or privacy acceptance was previously granted. Require source/site-by-site permissions where the browser/OS asks.

The student must be told **which providers**, whether content can be read, what is explicitly excluded, whether data is stored locally or in cloud, authorized model/vendor subprocessors, one-year activity record TTL vs **separately selected shorter social raw-content TTL**, processing frequency, correction and deletion flow. Do not store DMs, private feeds of other accounts without authorization, passwords, session cookies or financial/health content; default private-message and authentication pages to no collection.

Encryption TLS in motion, envelope encryption of raw payloads at rest, key management/rotation, minimal decrypt privileges, tenant isolation, audit logs, input constraints, source rate limits, off-switch, incident procedure, storage/retention cost caps, and secure provider authentication are required. Encrypting data does not itself authorize collection. Revocation stops future ingestion, queued AI jobs and raw-context reads; handle prior data per user control and deletion rules. Sensitive collection and cloud analysis require independent security/privacy/legal review before release. No account-wide AI surveillance without meaningful opt-out. No sale/advertising monetization of feed content.

## 10. Retention policy and honest exposure reporting

User selected **365 days by default for ordinary authorized detailed activity** in companion architecture; this is a proposed product default, not permission or legal authorization. Due to third-party rights and higher sensitivity, **raw post text, screenshots, media/transcripts and individual-level feed exposure require an explicit separate, shorter policy review and setting**; do not silently use one-year raw post-content storage. Aggregated risk metrics can follow separately selected approved lifetime; delete index/embedding/LLM cache copies on deletion and document backup expiry guarantees. User can pause, export, correct and delete.

Report `N` sampled classifiable items and `M` unclassified, alongside overall observation coverage. A social platform showing as foreground is usage evidence, not feed-item coverage. Partial samples cannot support claims about all content consumed. A feed item on screen is not proof user read/absorbed it. Forecasting causal mental effects from content exposure is not supported.

## 11. Dashboard and AI Mentor behavior

Dedicated **Social Feed Exposure** page instead of flooding the main student dashboard:
- Overview: connected platforms, permission badges in settings (not decorative), latest source sync, supported capabilities, observation coverage.
- Usage chart: observed social-app foreground time per device/day; caveats for simultaneous or idle devices.
- Sampled feed themes: content distribution among classifiable observations, numerator/denominator, confidence and unknown category.
- Safety indicators: possible harmful content labels for observed items, explanatory context, ability to review/correct.
- Academic alignment: overlap with student's actual exam targets only when metadata and matching support it; no forced academic requirement for leisure.
- Well-being check-in (optional): asks student rather than inferring personal toxicity.
- Evidence explorer: item-level redacted details with permitted preview, timestamp and source. Missing unsupported sources visibly noted.
- Mentor insight: e.g. "Among 22 observed feed items, 3 were flagged for potentially harassing language (classification pending verification). This sample does not represent the entire feed; your reported mood is unknown. Would you prefer to mute recommendations about social activity?"

The compact home card may show `social activity observed` and `review insights` but should not shame, diagnose or produce a false health score. The user can mute this module or adjust frequency.

## 12. Rollout steps, testing and hard gates

**Phase S0 — Product and rights feasibility (NO collector expansion):** choose one specific supported social website and permission-based capture capability; validate current provider rules, allowed data fields, browser store eligibility, threat model and adult consent UX. Build a legally/technically permissible proof of visibility and missingness before assuming feed access.

**Phase S1 — Shared privacy/data contracts:** design migrations, scoped source registry, unique IDs, sensitive vault, consent and source policy version, retention and audit. Add test fixtures and schema validators.

**Phase S2 — One web adapter:** explicitly user-enabled for one approved site; safe collection of allowed metadata/item visibility only; dedup/retry and exact capabilities; never modify the existing PW tracker as an accidental side effect.

**Phase S3 — Classification and quality analytics:** synthetic/permissioned fixtures, multilingual taxonomy, calibrated model pipeline and uncertain classifications. Deterministic exposure metrics with verified denominators and correction workflow.

**Phase S4 — Integration:** link Behavior Intelligence and Learning Graph only through evidence-labeled summary APIs, create Social Feed page and controlled Mentor insights. Enforce purpose-specific access.

**Phase S5 — Gradual expansion:** authorized provider APIs, opt-in shared content, other supported social websites, and mobile usage **only within approved OS capability**; no assumption of native mobile feed access.

**Release criteria:** platform compliance and security review pass; no age-under-18 entry; collection off before specific permission; no private-message capture; secrets/payment fields redacted; revoke/pause halts ingestion and AI; wrong-account requests denied; duplicate observations do not inflate exposure; loss of visibility does not create fabricated read time; generic foreground usage does not fabricate a feed content label; out-of-domain/ambiguous content abstains; labels are evidence-reviewable/correctable; deletion propagates to raw vault and derived indexes; classifier benchmarks and false positive limits documented; third-party AI processors receive only approved content.

## 13. Relationship to the other AIMERS documents and unresolved choices

This specification is **companion, not substitute** for adult Behavior Intelligence and Learning Graph design. The provider syllabus remains original; playback alone is not authoritative lecture completion. Feed content does not determine academic aptitude, mood, or exam marks.

Before implementation planning: user reviews and approves this written spec; product/security/legal review identifies first supported social site and safe observation fields; determine exact raw social payload retention duration and whether media capture is omitted in first pilot; define observable success criteria and model validation datasets. No production claims or broad tracking permissions may be enabled before these gates.

**Do not modify or reset the user's local uncommitted PW hostname normalization and sync patch.** Code implementation requires a separately approved, staged plan after this document review.
