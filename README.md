# AIMERS OS V2

AIMERS OS is a subscription-based AI learning operating system.

## Applications

- Public marketing website
- Student learning application
- CEO and company administration dashboard
- Mentor and staff application
- Parent portal
- Institution portal
- Mobile application
- Browser extension
- Desktop activity agent
- API
- Background worker
- Realtime gateway

## Core student pages

- Today (daily study action and recorded progress)
- Detailed dashboard (retained at `/dashboard/details`)
- AI Mentor
- Behavior AI
- Digital Activity
- Planner
- Subjects
- Analytics
- Prediction
- Memory Engine
- Question Bank
- Mock Tests
- Flashcards
- Notes
- Research AI
- Community
- Achievements
- Settings

## Simpler student experience

The student app now has five everyday destinations: Today, Learn, Plan, Progress and Companion. Specialist tools remain searchable and in expandable navigation groups. See [the feature audit and product direction](docs/product/STUDENT_UI_REVIEW.md) for implemented features, scaffolds and validation limits, and [the UI system](docs/design/UI_SYSTEM.md) for the olive, cream and lime design.

### Local checks

```sh
pnpm install --frozen-lockfile --filter @aimers/web...
pnpm --filter @aimers/web typecheck
pnpm --filter @aimers/web build
node --experimental-strip-types --test tests/unit/student/today.test.mjs
```

A synthetic-data browser harness lives at `tests/e2e/student/today-ui.mjs`. It requires a separately installed Playwright runtime and a running student Vite server; its environment options are documented in the file. Browser subprocess launch was blocked in the review environment, so that harness has not been validated end to end. Manual browser checks are described in the audit.

Native mobile, the desktop agent, the browser extension and several AI services are scaffolds. Responsive student web pages do not imply those native implementations are complete.
