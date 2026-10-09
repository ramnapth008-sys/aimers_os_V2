# AIMERS OS — Complete Organization & Dataflow Blueprint

**Design document for review | 2026-10-09.** This is an organizational and systems map, **not a deployed implementation**. The companion downloadable print blueprint has ten A3 landscape pages and seven independently editable flowcharts.

## Outcome and boundary

A subscription-based personal learning and digital-behavior intelligence operating system, first piloted for verified adults. Student profile and OTP authentication; source-specific device/browser permissions; original learning-provider graph; evidence-based academic progress; local-first sensitive activity analysis; social-feed exposure intelligence; evidence-grounded AI Mentor; AIMERS-owned adaptive educational feed. **No personal data sale.** Highly sensitive raw searches, browsing/page content, private media and student mood records stay encrypted on-device by default. Derived cross-device synchronization is separately authorized and not yet a finalized launch setting.

The three-minute goal concerns a first useful **accurate, partial** dashboard, not universal access to historic native social-platform feeds or guaranteed full import. External feed optimization is automatic only if a provider explicitly supports the necessary authorized write operation. AIMERS-owned feed ranking is under our control.

## 1. Organizational system map

```mermaid
flowchart TD
  U[Verified adult student / subscriber] --> ID[OTP + persistent profile + subscription]
  ID --> P[Privacy scopes + independent OS / provider permissions]
  P --> X[Capability-scoped browser / desktop / mobile / learning / social collectors]
  X --> L[(Encrypted on-device raw activity vault)]
  L --> BI[Deterministic behavior metrics + local AI classifiers]
  X --> G[Learning Graph: provider hierarchy, lectures, evidence]
  BI --> M[Evidence-grounded AI Mentor]
  G --> M
  M --> D[Student dashboard]
  M --> F[AIMERS-owned automatically personalized knowledge feed]
  BI --> S{Separately authorized derived-metric sync?}
  S -->|Yes| C[Cloud-safe summaries and account services]
  S -->|No| V[Local-only analytics]
```

## 2. First-login flow / three-minute first report

```mermaid
flowchart TD
  A[Email / phone OTP] --> B{Verified adult?}
  B -->|No| LIMITED[Account-only / monitoring disabled]
  B -->|Yes| C[One-time name / age / role / exam or career goal / language]
  C --> D[Specific purposes + local-vs-cloud disclosure]
  D --> E{OS + browser + provider grants}
  E -->|Available| F[Start supported collectors / bounded imports]
  E -->|Unavailable or skipped| G[Record coverage gaps]
  F --> H[Accurate first dashboard, 180-sec processing target]
  G --> H
  H --> I[Nonblocking background enrichment]
```

## 3. Privacy, consent and dataflow

```mermaid
flowchart LR
  RAW[Authorized sensitive inputs] --> FILTER[Local consent / secrets filter]
  FILTER --> VAULT[(Encrypted on-device vault)]
  VAULT --> METRIC[Measured metrics / coverage / corrections]
  VAULT --> AI[Local content classification]
  METRIC --> DASH[Local dashboard / Mentor]
  AI --> DASH
  METRIC --> CONSENT{Separate cloud summary permission?}
  CONSENT -->|Yes| REDACT[Field allowlist / tenant policy]
  REDACT --> CLOUD[(Authorized cloud summary data)]
  CONSENT -->|No| LOCAL[No behavioral upload]
  DASH -.-> ERR[Only sanitized technical diagnostics]
```

## 4. Learning Graph semantics

```mermaid
flowchart LR
  SRC[Original permitted provider curriculum] --> CONF[Confirmed followed courses]
  CONF --> L[Stable provider lecture ID]
  L --> O[Observed playback events]
  L --> E[Provider / student completion declarations]
  O --> LEDGER[Separate evidence ledger]
  E --> LEDGER
  LEDGER --> BACKLOG[Pending / genuine overdue / discrepancy review]
  SRC --> MAP[Versioned AI-assisted concept mapping]
  MAP --> EXAM[Exam competency coverage, deduplicated]
  EXAM --> PRACTICE[Assessment-based mastery, not watch-time]
  BACKLOG --> MENTOR[Grounded AI Mentor]
  PRACTICE --> MENTOR
```

## 5. Social Feed & Growth Engine

```mermaid
flowchart LR
  WEB[Permitted observed web feed items] --> CHECK[Local content and permission filters]
  SHARED[User-shared authorized posts] --> CHECK
  APP[Native app usage only] --> USAGE[Time metadata, no presumed feed]
  CHECK --> CLASS[Multilingual themes / safety / content quality]
  CLASS --> EXPO[Sample-level exposure / uncertainty]
  USAGE --> EXPO
  EXPO --> OWN[Automatically optimize AIMERS knowledge feed]
  EXPO --> API{Provider permits scoped write API?}
  API -->|Yes| CHANGE[Apply and verify external preference action]
  API -->|No| NO[No external change; report unsupported]
```

## 6. Scale architecture

```mermaid
flowchart TD
  C[Student web UI + local collectors] --> API[NestJS gateway: auth / rate limiting / tenant policy]
  API --> A[Identity / consent / subscription modules]
  API --> L[Provider / learning / backlog modules]
  API --> I[Safe analytics / Mentor / feed modules]
  A --> PG[(PostgreSQL / Prisma)]
  L --> PG
  I --> PG
  L --> Q[(Redis jobs / retry / outbox)]
  I --> Q
  Q --> OBS[Sanitized telemetry, audits, SLOs]
  Q -.-> FUTURE[Future independently autoscaled workers]
  PG -.-> REGION[Future regional databases, managed broker / disaster recovery]
```

**Start with current pnpm/Turborepo, Vite/React, NestJS and Prisma/PostgreSQL.** Build modules with explicit domain APIs and event versioning before extraction. Move AI workloads and connectors into workers as measured throughput demands, then use managed message streaming, regional isolation and specialized data infrastructure when justified. Existing PW browser integration is an opt-in pilot; the developer's uncommitted local hostname patch and unverified server synchronization must be preserved, not overwritten.

## 7. Proposed organization

```mermaid
flowchart TB
  LEAD[Product + architecture governance] --> PRODUCT[Product design / user research / education partnerships]
  LEAD --> ENG[Platform API / device connectors / AI + data science]
  LEAD --> TRUST[Security + privacy + legal / SRE + customer support]
```

Functional responsibilities:
- **Product + design:** OTP, personal profile, adaptive onboarding, feedback, accessibility, subscription value.
- **Platform / core:** account auth, billing, consent, versioned APIs, data lifecycle, tenant isolation.
- **Connectors:** browser, desktop, OS-permitted mobile, external provider metadata.
- **AI/data:** local classification, exact metrics, calibration, Mentor policies and model evaluation.
- **Education intelligence:** original curricula, exam concept mapping, lecture evidence and academic outcomes.
- **Trust, reliability, support:** legal/provider rights, permission boundaries, incident response, deletion, audits and user correction.

## 8. Hard release gates

- Adult monitoring eligibility and source-specific permission are checked at ingestion and processing. Accepting a generic privacy policy is insufficient for new sources.
- No raw sensitive browsing or social-feed content egress by default; no credentials, payments, private messages or covert recording.
- Measured, inferred/classified, self-reported and predicted results remain clearly different. Missing provider coverage ≠ zero observed exposure; social app usage ≠ actual native feed inspection.
- No mind toxicity diagnosis from feed labels; no invented exam score or completed lecture; provider/self-report conflicts are preserved.
- Revoke/pause/delete propagate to collectors, active processing and derived stores; encrypted local storage and retention handling are implemented and tested.
- External social feed actions require confirmed provider-supported access and verified success. AIMERS-owned knowledge feed may re-rank automatically within the student's selected goals.
- Security model, local compute compatibility, supported social website and any sync payload design are reviewed separately before production.
- The architecture is approved in writing **before** a detailed implementation plan; implementation requires plan review and execution authorization.

## Related specifications

- `2026-10-09-aimers-learning-graph-connector-design.md`
- `2026-10-09-aimers-behavior-intelligence-continuous-ai-design.md`
- `2026-10-09-aimers-social-feed-exposure-intelligence-design.md`
- `2026-10-09-aimers-three-minute-onboarding-adaptive-intelligence-design.md`

**Status:** Reviewable technical/organizational design only. No product source or schema was modified for this blueprint.
