# Aimers OS: simpler student experience

Reviewed and updated on 8 October 2026.

## Product opinion

The strongest direction is helping a student choose a useful next action, understand a concept, and return later to check what lasted. A long-term learning record and careful education-path guidance could connect these steps across years. This is a product hypothesis, not an established innovation or a promise of exam success.

A student should see a clear daily learning experience. Five specialised AI roles can sit behind it: navigator, planner, tutor, examiner, and focus coach. The companion presents their help consistently. Multiple roles do not require five separately trained models. The existing project does not yet implement the full five-model vision or lifelong career-decision workflow.

## What changed

- `/dashboard` now opens **Today**: one next study action, up to three tasks, recorded progress, and a companion entry point.
- Five everyday destinations: **Today, Learn, Plan, Progress, Companion**.
- Specialist tools remain in expandable groups and searchable by their existing names.
- The previous dashboard remains at `/dashboard/details`.
- Starting and finishing a study session use the existing planner APIs. Ending a session records time; it does not claim that a task is complete or a concept is mastered.
- Syllabus coverage is described as recorded progress. Test accuracy comes from attempted mock-test questions. Missing evidence is shown as unknown, not a fabricated score.
- Optional subjects, test-results or privacy outages do not prevent access to an available study plan.
- The authenticated student's profile replaces the hardcoded dashboard name and career aspiration. Static PRO labels, notification counts, focus toggles and system-health claims were removed from the shared shell.
- Generic unimplemented modules explicitly say they are planned, with working links to existing study tools.
- The reference's dark olive, cream and lime palette is applied to the student shell, Today, and shared workspace surfaces. Existing specialist pages retain their detailed layouts and some subject-specific accents; this is not a redesign of every internal form.

## Student feature inventory

“UI + API code” means implementation exists in this checkout. It does not mean a production deployment, content quality, model accuracy, or live database integration has been verified in this review.

| Feature                                                          | Existing implementation                                                                     | Where the student finds it        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| Daily dashboard                                                  | New Today screen plus previous detailed dashboard                                           | Today / More insights             |
| Academic onboarding and exam target                              | UI + API code                                                                               | Initial onboarding, profile       |
| Subjects, syllabus, chapter progress, topic mastery              | UI + API code                                                                               | Learn                             |
| Study plans, tasks and recorded sessions                         | UI + API code                                                                               | Plan, Today                       |
| Question bank, bookmarks and practice sessions                   | UI + API code                                                                               | Study tools                       |
| Mock tests, attempts, runner and results                         | UI + API code                                                                               | Study tools                       |
| Flashcards and review sessions                                   | UI + API code                                                                               | Study tools                       |
| Notes, folders, tags, links and revisions                        | UI + API code                                                                               | Study tools                       |
| Research projects, evidence, citations, mind maps and AI replies | UI + API code                                                                               | Study tools                       |
| AI mentor, conversations, briefs and check-ins                   | UI + API/provider code; requires configured service and credentials                         | Companion                         |
| Behavior analysis and interventions                              | UI + API code; data and consent dependent                                                   | More insights / Study habits      |
| Digital activity and permission settings                         | UI + API code; consent-gated in-app collector exists                                        | More insights, Settings & privacy |
| Analytics and readiness estimates                                | UI / calculation / API integration code                                                     | Progress, More insights           |
| Revision-memory workspace                                        | UI + API code                                                                               | More insights                     |
| Integration setup and device records                             | UI + API code; several connectors explicitly pending                                        | Connections                       |
| Profile, settings, consent and privacy agreement                 | UI + API code                                                                               | Account, Settings & privacy       |
| Community, achievements, calendar, focus room                    | Generic planned-feature screens                                                             | Explore                           |
| Subscription, billing and help/support pages                     | Generic planned-feature screens                                                             | Search, footer                    |
| Lifelong education-path comparison and career experiments        | Product direction; not implemented                                                          | Future navigator workflow         |
| Five independent dedicated AI models                             | Not implemented as five running models                                                      | Future internal architecture      |
| Personal AI life friend                                          | Current mentor can be a starting point; full proposed companion behavior is not implemented | Companion direction               |
| AI voice assistant                                               | Dashboard entry exists; separate voice service is a scaffold                                | Future capability                 |

## Other workspaces in the repository

The project includes separate role-based web applications. Their entry points use `AdminRouter`, `StaffRouter`, `ParentRouter`, `InstitutionRouter` and `MarketingRouter`; the similarly named `AppRouter.tsx` stubs are not their active entry points. This review mapped their navigation and actual routes. They were not redesigned or tested against live services.

| Workspace      | Feature areas visible in code                                                                                                                                                                                                                                                                                                                                                                              | Current UI status                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Company/admin  | Overview; notifications; revenue, subscriptions and customers; students and profiles, cohorts, rankers, mentors and staff; learning, product and behavior analytics; digital activity, AI operations and predictions; experiments, interventions, content, questions, mock tests and community; privacy, consents, audit logs, data requests, security, system health, feature flags, support and settings | Dedicated overview/login/shell components exist. Other routes share `AdminModulePage` placeholders; feature folders alone do not establish working operations.    |
| Mentor/staff   | Dashboard; assigned students and profiles; daily alerts, missed lectures, backlogs, weak topics, tests and study behavior; interventions, mentor notes, communication, escalations, calendar, reports, settings and session history                                                                                                                                                                        | Dedicated dashboard/login/shell components exist. Other routes share `StaffModulePage` placeholders.                                                              |
| Parent         | Dashboard; child progress, attendance, study time, test results, weak topics, alerts and reports; subscription, privacy and settings                                                                                                                                                                                                                                                                       | Dedicated dashboard/login/shell components exist. Other routes share `ParentModulePage` placeholders.                                                             |
| Institution    | Dashboard; students, batches and teachers; attendance, performance, tests, content, analytics and reports; licences, billing and settings                                                                                                                                                                                                                                                                  | Dedicated dashboard/login/shell components exist. Other routes share `InstitutionModulePage` placeholders.                                                        |
| Public website | Home, pricing and authentication; features, how it works, student/parent/institution/coaching pages, security, privacy, terms, about, contact, blog, careers, help and status                                                                                                                                                                                                                              | Home/pricing/auth components exist. Remaining routes share a marketing content template; checkout/payment-success folders are not proof of a routed payment flow. |

These workspace names describe the broader vision. The first student pilot does not need all of these operations completed. Generic pages still contain static readiness/connection claims in some non-student portals; those must be replaced with real states before exposing those portals to users.

## Platforms and tracking

| Platform / source                                       | Code evidence                                                        | Practical implication                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| Student web app                                         | React/Vite application with substantial pages                        | Current functional UI target                                    |
| Phone and tablet browser                                | Responsive web CSS, mobile drawer and bottom navigation              | Same web app adapts to viewport; not a native app               |
| Native mobile                                           | `apps/mobile/src/app/App.tsx` contains `export {};`                  | Native app is not implemented                                   |
| Desktop agent UI                                        | `apps/desktop-agent/src/app/renderer.tsx` contains `export {};`      | No complete desktop companion                                   |
| Browser extension                                       | Background entry contains `export {};`                               | No installed cross-site collector yet                           |
| Aimers web activity                                     | Consent-gated collector runtime exists in the web app                | Covers supported in-app events, not all device activity         |
| Android, Apple, desktop and browser tracking connectors | Setup service explicitly describes missing collectors/approval flows | User consent alone cannot activate unfinished connectors        |
| Google/YouTube and external learning providers          | Setup service describes missing OAuth/provider/sync adapters         | No universal lecture tracking yet                               |
| Separate Python AI services                             | Named entry points are one-line scaffolds                            | Service folders are not proof of running models                 |
| Existing TypeScript AI provider                         | Provider integration and mock mode exist                             | Real outputs depend on configuration and running infrastructure |

The app should offer availability throughout the day and separately selectable access to study sources and device signals. Keep pause, consent revocation, deletion and connection status easy to find. Each platform needs a real implementation of its supported permission mechanisms. Do not present a student's blanket approval as proof of unrestricted device access.

## Validation

- Student TypeScript check and production Vite build passed.
- Eight Node tests passed: timezone boundaries, cancelled/future tasks, active sessions, missing evidence, actual completion dates, optional outages and required planner failure.
- Manual browser checks against the actual Vite app and an explicitly synthetic local API verified session start, running elapsed timer, finish/save, mutation failure, search by legacy names, no-results search, Escape closing search and navigation, navigation to the existing Learn workspace, empty plan, optional subjects outage and required planner outage.
- Responsive CSS provides desktop, tablet and phone layouts. The phone preview was visually reviewed. Wider preview capture was constrained by the in-app browser's viewport/capture behavior, so exact width and overflow verification is incomplete.
- A Playwright harness covers five widths (1440, 1024, 768, 390 and 320px) and the above states. Browser subprocess launch was blocked by the macOS sandbox; the harness is provided but its end-to-end run did not pass validation in this environment.
- Preview screenshots are **sample student data**, not evidence from a real learner.
- Live database persistence, native apps, external collectors, model quality and exam outcomes are outside this UI verification.
- A large JavaScript chunk warning remains in the build. Route-level lazy loading is a sensible subsequent performance task.

## Small next product experiment

Recruit five students preparing for the same exam. Let each use one subject's daily plan, selected study materials, short independent checks and a later revisit. Observe where they get stuck, which recommendations they accept, and whether they return voluntarily. Compare guidance against their existing routine. A short pilot provides early signals; it does not establish long-term learning gains.
