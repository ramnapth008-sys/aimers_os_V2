# Aimers OS: feature inventory and UI review

Reviewed and updated on 8 October 2026.

**Current decision:** the user prefers the original Aimers UI. The experimental olive Today screen and grouped navigation were removed. The original student interface was restored from `9db905e`, with targeted responsive layout and readability fixes. Future improvements should preserve that visual identity and proceed incrementally.

## Product opinion

The strongest direction is helping a student choose a useful next action, understand a concept, and return later to check what lasted. A long-term learning record and careful education-path guidance could connect these steps across years. This is a product hypothesis, not an established innovation or a promise of exam success.

A student should see a clear daily learning experience. Five specialised AI roles can sit behind it: navigator, planner, tutor, examiner, and focus coach. The companion presents their help consistently. Multiple roles do not require five separately trained models. The existing project does not yet implement the full five-model vision or lifelong career-decision workflow.

## Restoration

- Original Dashboard is again the default at `/dashboard`.
- Original sidebar, top bar, shared shell, styling, favicon and module screens were restored together.
- The experimental Today page, theme override and its dedicated tests were removed; the experiment remains recoverable in Git history.
- The original dashboard, routes and feature screens are retained. A final responsive stylesheet reflows dashboard cards using their available space, including the space taken by the sidebar. Small labels and controls are more readable, and closed mobile navigation is hidden from keyboard focus.
- The Ask AIMERS button keeps its accessible name when its text is hidden on mobile.
- The feature inventory is retained as a planning reference. Many features remain prototypes or scaffolds as described below.

## Student feature inventory

“UI + API code” means implementation exists in this checkout. It does not mean a production deployment, content quality, model accuracy, or live database integration has been verified in this review.

| Feature                                                          | Existing implementation                                                                     | Where the student finds it        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| Daily dashboard                                                  | Original detailed dashboard restored                                           | Dashboard             |
| Academic onboarding and exam target                              | UI + API code                                                                               | Initial onboarding, profile       |
| Subjects, syllabus, chapter progress, topic mastery              | UI + API code                                                                               | Subjects                             |
| Study plans, tasks and recorded sessions                         | UI + API code                                                                               | Planner / Dashboard                       |
| Question bank, bookmarks and practice sessions                   | UI + API code                                                                               | Original specialist navigation                       |
| Mock tests, attempts, runner and results                         | UI + API code                                                                               | Original specialist navigation                       |
| Flashcards and review sessions                                   | UI + API code                                                                               | Original specialist navigation                       |
| Notes, folders, tags, links and revisions                        | UI + API code                                                                               | Original specialist navigation                       |
| Research projects, evidence, citations, mind maps and AI replies | UI + API code                                                                               | Original specialist navigation                       |
| AI mentor, conversations, briefs and check-ins                   | UI + API/provider code; requires configured service and credentials                         | AI Mentor                         |
| Behavior analysis and interventions                              | UI + API code; data and consent dependent                                                   | Behavior AI      |
| Digital activity and permission settings                         | UI + API code; consent-gated in-app collector exists                                        | Digital Activity / Settings |
| Analytics and readiness estimates                                | UI / calculation / API integration code                                                     | Analytics / Prediction           |
| Revision-memory workspace                                        | UI + API code                                                                               | Memory Engine                     |
| Integration setup and device records                             | UI + API code; several connectors explicitly pending                                        | Integrations                       |
| Profile, settings, consent and privacy agreement                 | UI + API code                                                                               | Account, Settings & privacy       |
| Community, achievements, calendar, focus room                    | Generic planned-feature screens                                                             | Original specialist navigation                           |
| Subscription, billing and help/support pages                     | Generic planned-feature screens                                                             | Search, footer                    |
| Lifelong education-path comparison and career experiments        | Product direction; not implemented                                                          | Future navigator workflow         |
| Five independent dedicated AI models                             | Not implemented as five running models                                                      | Future internal architecture      |
| Personal AI life friend                                          | Current mentor can be a starting point; full proposed companion behavior is not implemented | AI Mentor direction               |
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
| Phone and tablet browser                                | Responsive web CSS and mobile navigation drawer                       | Same web app adapts to viewport; not a native app               |
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

- The restored student web source was compared with the previous commit. Final differences are limited to the responsive stylesheet/import and the mobile Ask AIMERS accessible label.
- Student TypeScript check and production Vite build passed.
- Browser checks confirmed the dashboard loaded at CSS viewport widths of 320, 390, 768, 1024, 1440 and 1920 pixels. Main content and header elements stayed within the viewport; dashboard cards reflowed and the mobile drawer opened and closed.
- The local browser preview uses explicit synthetic responses for academic, planner, mock-test, notes and research workspaces. It demonstrates the original interface, not live account or database integration.
- Live database persistence, native apps, external collectors, model quality and exam outcomes are outside this UI verification.
- The existing large JavaScript chunk warning remains a future performance task.

## Small next product experiment

Recruit five students preparing for the same exam. Let each use one subject's daily plan, selected study materials, short independent checks and a later revisit. Observe where they get stuck, which recommendations they accept, and whether they return voluntarily. Compare guidance against their existing routine. A short pilot provides early signals; it does not establish long-term learning gains.
