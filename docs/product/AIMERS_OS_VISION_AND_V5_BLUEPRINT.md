# AIMERS OS — Product vision and student-centered V5 blueprint
Status: Product requirements and research hypotheses; NOT a production implementation.
Date: 2026-10-08

## 1. Product definition
AIMERS OS (Education OS) is a subscription-based, unified learning environment. Like a general OS that provides a consistent platform for applications, AIMERS coordinates study tools, context, accounts, analytics and AI experiences. It is not an operating-system kernel.

**North star:** Help each student understand what to learn next, execute it, and reflect on progress, with agency and privacy.

Customer segments:
- Student individual plans differentiated by capabilities and appropriate usage limits.
- Parent/guardian views with age-appropriate transparency and student dignity.
- Schools, coaching institutes, tutoring teams and organizations.
- Internal operations: administration, support, finance, analytics, R&D, growth, leadership.

## 2. Product feature map
### Student learning core (initial launch)
1. Exam-based pathways: NEET, JEE, UPSC and future exam-specific syllabi/UI, with a universal design system.
2. Subjects, chapters, content, and lesson resume.
3. Study plan, task backlog, calendars, focus sessions.
4. Question bank, PYQs, mock tests, flashcards, notes, revision.
5. Performance analytics and understandable, uncertainty-aware forecasts.
6. AI Tutor/Mentor for explanations and help in local languages where quality is validated.
7. Community: exchange notes, goal updates, achievements with moderation and anti-harassment controls.

### Advanced intelligence (stage-gated)
- Behavior and study-pattern insights (first-party learning actions before third-party tracking).
- Cross-device learning continuity with explicit device linking and permission scopes.
- External activity and social-platform signals only if lawful, technically supported, age-appropriate, and granular-consent based. Do not promise universal access to Instagram/YouTube/search history or unrestricted device monitoring.
- Learning deviation alerts: private, actionable, adjustable and non-shaming. No automatic punishment or coercive restrictions.
- Peer comparison: opt-in, aggregates/percentiles only above privacy-preserving cohort thresholds; no identifiable student ranking or public shame.
- Score predictions: calibrated ranges, explanation of inputs, confidence and limitations; never deterministic claims about admissions/outcomes.
- AI study companion: adjustable voice/name/language, study reflection, motivation, goal planning; transparent AI identity, not portrayed as a human best friend or therapist. Escalation and human resources for distress.
- Voice: evaluate multilingual speech recognition, synthesis, latency, privacy, accessibility and cost.

### Subscription philosophy
Plans based on exam pathway, tutor usage, storage, advanced analytics, and institution capabilities, not paywalls on essential privacy, accessibility or basic consent controls. Publish transparent quotas, opt-outs and deletion controls. Validate willingness to pay before committing pricing.

## 3. Portal topology
- Marketing: public offering, benefits, pricing and onboarding.
- Student: studying, personalized plans, AI help and progress.
- Parent: permitted high-level progress, supportive communication and privacy.
- Mentor/teacher/staff: teaching, learner support, authorized interventions.
- Institution: curriculum, cohorts, teachers, reports and permissions.
- Platform administration: tenant management, compliance, reliability, support.
- Internal organization: R&D/model lab, analytics, finance/billing, customer support, CRM/leads, growth, executive and board reporting, security/compliance.
Separate portal UX by tasks and authorization. Do not expose internal portals through the student navigation. Use role- and tenant-scoped APIs with least privilege.

## 4. The central UX decision
**No feature-rich cockpit on entry.** Progressive disclosure means a new student sees:
- ONE primary action: Start/continue learning.
- TWO or THREE contextual secondary actions: ask tutor, review task, practice.
- A single evidence-grounded attention item if important; never arbitrary urgent styling.
- Clear access to Learn / Practice / Plan / Progress / Ask AIMERS, with advanced tools in contextual routes.
- First visit: exam/goal selection, optional diagnostic assessment, simple first task. Returning students: last session + near-term work.
- Avoid vanity stats, unexplained percentages, technical labels, multiple competing alerts and promotional banners.
- Provide a non-scrolling desktop home when layout permits; support zoom/mobile/small screens with accessible scrolling, never clipped text.

### Concept V5 information hierarchy
Header: welcome (once), search/AI shortcut, account.
Hero: **Continue studying: [topic]**, one CTA, contextual next-step line.
Small adjacent panel: **Today** (up to 2 tasks + completion); if empty, one clear Create plan CTA.
Underneath: two compact modules: **My subjects** (up to three) and **Ask AIMERS** (one prompt + capability explanation).
Secondary tool launcher tucked behind an accessible **All study tools** action.
No default Brain visualization, mock rank, device activity, AI prediction score or large research panel.

## 5. Scientific rationale and validation
Research topics to review and link in an evidence register:
- Mayer & Moreno 2003, Nine Ways to Reduce Cognitive Load in Multimedia Learning: segmenting/clarity, limited simultaneous material.
- Self-determination theory (Ryan & Deci): agency, competence and relatedness.
- Matcha et al. systematic reviews on learning analytics dashboards and self-regulated learning: insight-to-action design matters.
- Nielsen Norman Group teen usability research: familiar-looking interfaces can still be complex.
- WCAG 2.2 and ISO usability practices.
- Public student communities/reviews: qualitative hypotheses only; distinguish age/region/exam and note selection bias.
Keep paper citations with actual links, methods and study populations in a later evidence register. Never claim preference generalization from a few Reddit comments.

User tests: at least two prototypes and 8–12 exploratory interviews/usability sessions spanning first-time users, returning users, school-age and adult candidates, exam tracks and language needs. Respect parental permission/assent where relevant. Measure first-action success, time to lesson, misclicks, comprehension of predictions/alerts, task completion and subjective load; follow with larger quantitative evaluations.

## 6. Privacy, safety and children
Privacy promise: do not sell personal student data. Do not share identifiable information for advertising. Distinguish third-party subprocessors (hosting, payments, speech/AI) from selling data; truthful policy must disclose every permitted processor, location, retention and access path. Database-only storage does NOT guarantee that AI providers never receive data. Architect minimization and encryption, access logs, pseudonymization, retention, export, erasure and incident response.
India's DPDP framework imposes requirements for children and restricts tracking/behavioural monitoring and targeted advertising, subject to legal exceptions and rollout. Obtain qualified legal review before any minor-monitoring feature; consent by itself does not override prohibitions. Treat adults and minors differently; age assurance, guardian controls and age-appropriate defaults.
No secret/background surveillance, hidden browsing capture, coercive focus restrictions, exposing sensitive data to peers/parents beyond lawful scopes, unvalidated mental-health diagnosis or dependency-producing anthropomorphism. Student can view, pause and revoke allowed monitoring where supported.
Peer data: avoid small group leakage and rankings; prefer personal baselines and anonymized opt-in benchmarks.
AI friend: clear AI disclosures; practical emotional support; crisis safeguards and routes to real humans; no manipulative attachment mechanics.

## 7. Own-model strategy
Do not make training a frontier LLM a launch dependency. First use provider-agnostic inference gateways and models meeting privacy, language and cost requirements; control prompts, retrieval, orchestration and student data policies. Evaluate self-hosted open-weight models for narrowly defined workloads (classification, question tagging, recommendation ranking, speech models, student mastery estimation). Benchmark latency, factuality, Malayalam/Tamil/Hindi/English performance, learning gains, hosting costs, guardrails and calibration before fine-tuning. Separate statistical predictor claims from conversational LLM-generated guidance. Training data rights and provenance are required.

## 8. Architecture and boundaries
Shared identity, permissions/tenant isolation, consent service, syllabus & exam ontology, event pipeline, secure data store, retrieval/knowledge, prediction services, model gateway, auditing, billing, notification preferences and modular frontend design system.
Students own their study session context. Features may consume consented study events, not indiscriminate device histories. Only role-appropriate aggregated metrics reach organization dashboards. Provide an audit trail for data-derived recommendations.

## 9. Release sequence
Stage 0: inventory existing code, remove fake/demo status claims, verify data and permissions, baseline the current dashboard.
Stage 1 (V5 first): beginner/returning student home; NEET pathway pilot; solid lesson -> questions -> revision -> plan loop; multilingual mentor basics.
Stage 2: validated analytics, formative mock-test feedback, flashcards and spaced repetition; guarded community.
Stage 3: institution/parent tools, subscriptions, robust data protection and monitoring transparency.
Stage 4: calibrated exam-specific outcome estimates and opt-in, lawful behavior insights; only then consider selective external integrations.
Stage 5: custom specialized models, additional exam UIs and international expansion.

## 10. Decision gates
- No UI production merge without TypeScript build, keyboard accessibility, mobile/zoom check and task-based student testing.
- No predictive/behavioral claim without data provenance, calibration and model-card assessment.
- No externally sourced data ingest without explicit consent, compliant legal basis, retention and connector API permissions.
- No companion launch without age-aware safety design and escalation options.
- No paid launch without transparent plan limits, billing and human support.

## 11. Open questions
Pilot cohort: NEET versus broader exam-agnostic? Age range under/over 18? Which regions/languages first? Which features currently fully operational versus conceptual? Which third-party services process student data? Pricing and cost-per-active-student targets? These should be answered by discovery, not invented.
