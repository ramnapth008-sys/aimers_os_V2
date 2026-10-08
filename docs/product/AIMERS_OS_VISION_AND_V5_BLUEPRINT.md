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

## 12. Cross-device learning continuity and digital wellbeing
**Product intent:** unify permitted learning events from AIMERS and supported external learning websites/apps across the student's approved devices; recommend practical study improvements. Never describe it as invisible surveillance or blanket control of personal devices.

### Data collection layers
1. **First-party AIMERS events**: chapter progress, task completion, test results, note and flashcard activity. Available by default as essential app functionality with transparent privacy notice.
2. **Browser extension, opt-in**: installed explicitly on a named Chrome-compatible browser, with clearly displayed enabled sites, browser permissions, pause button and local filtering. On supported video players, content scripts may observe play/pause/seeks/time position in permitted tabs. DOM/player access is site-specific and fragile; don't claim full Physics Wallah/Vedantu/YouTube compatibility until tested. Prefer partner APIs when offered.
3. **Native desktop agent, opt-in**: primarily app/window category and focused-study session duration, not screenshots, messages or keyboard activity. macOS permissions and platform policy may limit collection; avoid broad screen recording and accessibility interception as a workaround.
4. **Android agent, opt-in**: where allowed, Android's UsageStatsManager can report foreground-app usage after special user-granted usage access. It cannot routinely extract an app's private feed, message contents, or precise scroll/rewatch analytics. Respect Play Store policy.
5. **iOS agent, limited**: permitted Screen Time / Device Activity frameworks require specific entitlements and authorization and tend to expose restricted or privacy-preserving activity. Never promise universal granular cross-app data.
6. **Official integrations**: use provider-authorized APIs/exports only with validated terms and granular permissions. An app name alone does not justify claiming access to internal engagement signals.

### Cross-device design
Each device is explicitly paired to the student's account with a visible identity, device-specific permission scopes, expiration and revoke controls. Local collector -> encrypted authenticated event ingestion -> consent/eligibility service -> schema validation & coarse categorization -> retention-limited event storage -> study session correlation -> explainable coaching signals -> student UI. Do not continuously stream raw web histories or private content.
Cross-device data is available only when each device independently provides lawful permissions. A mobile installation does not silently grant access to a laptop: the laptop must also run an authorized integration/extension (or other supported user-approved sync).

### Supported observations versus inference
- Lecture pauses and seeks may indicate note taking, confusion, re-listening or external interruptions, not a diagnosis.
- Academic searches: default to aggregate counts and topic tags; raw search terms only upon explicit separate permission and subject to age restrictions and local processing/redaction.
- Apps such as Instagram and messaging: aggregate usage windows or user-supplied wellbeing statistics where APIs allow; toxic-feed classification cannot be promised absent lawful content access and would risk sensitive profiling and false positives.
- Spam messages: use operating-system notification summaries or on-device aggregate counters only where available and explicitly approved; do not read private messages or contacts.
- Distraction detection: summarize fragmented sessions, repeated app switching or unusually long non-study windows, and ask for context before suggesting changes. Students can correct/delete categorization. Breaks, leisure and social interaction are not automatically harmful.
- Alerts: selectable quiet hours, frequency limits, non-shaming language and an easy pause. No unsolicited peer/parent reporting.

### Coaching examples (hypotheses, not factual automatic conclusions)
- "You replayed this portion several times. Want a different explanation?" only after a supported consented replay signal.
- "Your study session included frequent app switches. Was it research or a distraction?" ask, do not judge.
- "Would you like a 20-minute focus block?" optional suggestion rather than lockout.
- "This topic appears often in your study questions" only after limited, permitted topic classification.

### Age/privacy release gate
For minors in India, DPDP section 9 restrictions on children's tracking and behavioral monitoring, applicable commencement dates/rules and possible limited exemptions require specialist legal review. Do not assume parental consent alone permits monitoring. Launch minors with academic first-party progress and explicitly eligible features; disable cross-app behavior profiling until confirmed lawful. Adult opt-in version must provide genuine purpose-specific choice, accessible revocation, minimization, short retention, processing disclosures and no sale of student data. Apply comparable rules for other countries and app-store policies before expansion.

### Engineering validation
Implement a capability matrix by browser/platform/provider, permission receipt/version, tested event types and failure modes. Pilot with adults and owned or demonstrably compatible learning players first. Validate signal precision (pause/seek counts), sync deduplication, timezone/session attribution, student interpretation and false-positive rates. Do not label any external provider as supported without live technical tests.

### UX implications
The student home should not display a surveillance dashboard. Display a small optional "Study habits" insight only when useful and permitted, with a "Why am I seeing this?" explanation and a Privacy & Devices view. Provide one-tap pause, permission review and unlink per device.

## 13. Two-card lecture coverage and backlog UX (V5 requirement)

**Information design**: Show just two concise student-facing cards; do not add separate pause, activity, lecture, topic, backlog and focus cards. Use visual hierarchy: lecture context -> completion -> comparison of time -> optional expansion, and backlog -> highest-impact next step -> planner action. Sample data is illustrative only.

### Card A: Learning Activity
- Current/latest **source/platform**, linked **subject / chapter / lecture** (verified mapping only), and explicitly observed **topics covered**.
- Visible core: lesson name, completion fraction/percentage, **published video duration**, **actual elapsed time** (start to stop excluding offline gaps and with interruption handling), **pause count**; optional rewind count in condensed footer.
- Separate **video watch time** (media-played seconds) from **wall-clock learning session duration** (real time, including pauses). Playback speed and repeated sections can produce differences; do not label the difference "wasted time." Define how backgrounded tabs, idle time, seek events, replay counts and session resumptions are counted.
- When exact video/seek telemetry unavailable, display "Not supported" or "Not tracked" instead of 0. Estimated inferred topic coverage must be labeled "estimated" and should support manual correction.
- Video position 60% is not necessarily 60% of topics learned. Use actual syllabus mappings, lesson metadata, assessments or learner confirmation before claiming topics mastered.

### Card B: Backlog & Next Steps
- Show maximum two unresolved items with actionable labels and quantities, from **scheduled tasks** and **validated incomplete lecture/topic states**, not from indiscriminate browsing history.
- Definition of backlog: unfinished **planned/due** learning activity; merely unstarted syllabus chapters are not a personal backlog unless planned.
- One contextual recommendation: resume an incomplete lesson, finish a specific planned topic, or do a short quiz if the student has covered the prerequisite content.
- Alerts must be non-shaming, adjustable, scoped to exam goals, and not compare peers without separate opt-in.
- Empty case: "You're on track" or "No study plan yet" as grounded; connectivity-off case: "Activity monitoring is off" and link to privacy settings; never invent due dates or urgency.

### Current repository data assessment (2026-10-08)
- Existing `apps/web/src/pages/digital-activity/digital-activity.types.ts` defines `LectureSession`: `platformName`, `courseTitle`, `lectureTitle`, `totalDurationSeconds`, `watchedSeconds`, `focusedSeconds`, `playbackPositionSeconds`, `completionPercent`, `completed`, and `confidence`. Existing `ActivityEvent` carries timestamps, durations, app/domain, device and confidence.
- Existing `apps/web/src/pages/subjects/subjects.types.ts` models syllabus subjects, chapters, topics and learner chapter/topic progress.
- Existing `apps/web/src/pages/planner/planner.types.ts` supplies planned tasks, time estimates, completion/due dates and study sessions.
- Missing verified API fields for pause/rewind counts, lecture-to-topic mapping and elapsed lecture session wall-clock time. Needs an event capture/evaluation design and schema extension; don't equate watchedSeconds to actual elapsed minutes or inferred video completion to topic mastery.
- V5 is a blueprint only; these two cards must not display invented student monitoring data in production.

### Initial event/schema proposal (subject to privacy/legal review)
`lecture_session_id`, `linked_device_id`, `platform`, `external_lecture_id`, `syllabus_chapter_id?`, `syllabus_topic_ids[]?`, `started_at`, `last_seen_at`, `ended_at?`, `published_duration_seconds?`, `wall_elapsed_seconds?`, `active_player_seconds?`, `video_progress_seconds?`, `pause_count?`, `rewind_count?`, `seeks_backward_seconds?`, `event_source`, `observation_confidence`, `consent_scope`. Segment by seek/pause/resume/navigation and deduplicate device retries. Separate **observed** from **manually entered** and **inferred** fields.
Privacy: aggregate locally where possible, no raw search terms or page content required to render these two cards, student-visible device permissions and pause controls. For under-18 students enforce age-specific legal restrictions before collecting external behavior events.

### Acceptance test for novice students
Within 5 seconds of reading these two cards, a new student should be able to answer: "Which lecture did I study?", "How much did I cover?", "How long did it take?", "What is left to do?", and "Where can I resume?" Test with first-time users; avoid showing more than two backlog items or a second dashboard CTA competing with resume.
