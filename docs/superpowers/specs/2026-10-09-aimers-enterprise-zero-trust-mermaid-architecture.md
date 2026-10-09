# AIMERS OS — Enterprise Zero-Trust Architecture (Mermaid master blueprint)

**Design-only; requires user review before engineering plan.** This enterprise-wide extension covers student, staff, institution, CEO, board, finance, growth, data engineering, analytics, R&D, MLOps, security operations, IAM, privacy, DevOps, support and HR roles. Companion conversation artifacts contain the complete set of **20 individually editable Mermaid charts** and a portal ownership matrix.

**Product boundaries:** subscription-funded; verified adults first for sensitive behavior monitoring; per-source permission and platform rules; no sale of student data; raw search/feed/mood data **local-encrypted by default**. Derived behavioral cross-device sync remains an opt-in option requiring product approval, not an implicit existing capability. Never diagnose “mind toxicity” from content labels or claim a provider feed was changed without authorized supported write access. The three-minute onboarding target is for a *truthful first useful report*, not exhaustive external account imports.

## Organization / identity boundary

```mermaid
flowchart TB
  O["AIMERS OS"] --> P["Student / Staff / Institution / Guardian / Education Quality"]
  O --> E["CEO / Board / Admin / Privacy and Legal"]
  O --> D["Data Engineering / BI / R&D / MLOps"]
  O --> B["Finance / Growth / Support / HR / Partnerships"]
  O --> S["SOC / IAM Security / SRE"]
  P --> I["Zero-trust identity and policy engine"]
  E --> I
  D --> I
  B --> I
  S --> I
  I --> A["Purpose and tenant-restricted BFF/API"]
  A --> M["Independently owned domain modules"]
  M --> R["Scoped PostgreSQL domains, event bus and audit"]
```

## Incoming traffic scanning and zero-trust access

```mermaid
flowchart LR
  C["Client / connector"] --> W["TLS / CDN / WAF / DDoS / bot"]
  W --> R["Rate limit, nonce and strict schema"]
  R --> I["Authentication + device context"]
  I --> P["RBAC + ABAC + consent + tenant + purpose"]
  P --> X{"Exact access allowed?"}
  X -->|No| D["Deny + sanitized SOC signal"]
  X -->|Yes| S["Least-privilege domain service"]
  S --> F{"Uploaded file?"}
  F -->|Yes| Q["Quarantine, format and malware scan"]
  F -->|No| T["Permitted data operation"]
  Q --> T
  T --> A["Sanitized immutable audit"]
```

## Private data and device independence

```mermaid
flowchart TB
  C["Permitted local browser / device / source events"] --> P["Consent and content filtering"]
  P --> L[("Encrypted device-only raw vault")]
  L --> AI["Local deterministic metrics / permitted AI"]
  AI --> D["Local student dashboard"]
  AI --> S{"Separately approved derived-metric sync?"}
  S -->|No| N["Keep data on device"]
  S -->|Yes| E["Allowlisted provenance-aware summary"]
  E --> G["Policy-enforced cloud ingestion"]
  G --> R[("Tenant-scoped summary projection")]
  R --> X["Other student-owned devices"]
```

## AI / internet connection controls

```mermaid
flowchart LR
  Q["Mentor request"] --> A["Identity, entitlement, purpose check"]
  A --> M["AI orchestrator with budget"]
  M --> S["Deterministic learning and behavior facts"]
  M --> R["Scoped RAG retriever"]
  R --> V[("Tenant-aware approved search index")]
  R --> E["Controlled internet proxy, domain allowlist and SSRF checks"]
  E --> U["Permitted external documents"]
  U --> F["Untrusted-content filtering and injection isolation"]
  F --> R
  S --> P["Evidence and uncertainty package"]
  R --> P
  P --> O["Approved model with data-policy checks"]
  O --> G["Output validation, cited numbers, redaction"]
  G --> D["Mentor answer / correction controls"]
```

## Operations and scaling

Use separate logical domains and per-schema least-privileged access in PostgreSQL first, alongside a controlled event/outbox pipeline. Extract worker services and independent stores only when throughput/residency/availability requirements justify them. Add signed software supply chain, vulnerability scanning, secret management, access reviews, SOC alerting, incident response, disaster-recovery testing and security chaos exercises. **There is no such thing as guaranteed unhackable software**; Zero Trust is a set of continuous controls, tests and recovery practices.

### Portal ownership guardrails

Student: personal data. Mentor: consented assigned educational data. Institution: tenant-scoped learning and contracts. CEO and board: aggregate approved KPIs. Finance: billing ledger. Marketing: campaign aggregate metrics. Data Engineering/BI: pipeline metadata and approved de-identified marts. R&D: consented/licensed/synthetic evaluated datasets. SOC: infrastructure security metadata and approved investigative workflows. IAM: grant administration, no raw data free pass. SRE: production health, no standing user-data decryption keys. Privacy: consent, deletion and data-rights workflows. Guardian/under-18 experiences require their own privacy/legal gate. No portal role implies raw private browsing access.

### Review gate

This master overview is accompanied by the separately generated full Mermaid pack, containing 20 charts, three logical database ER models, 21 portal-to-service ownership mappings, onboarding, API traffic scanning, ingestion, finance, security, data lifecycle, cross-device and scaling. The written architecture must be reviewed before detailed implementation planning; no production code changes were made.
