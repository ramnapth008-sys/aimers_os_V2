import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppShell } from "../shell/AppShell";

import { DashboardPage } from "../../pages/dashboard/DashboardPage";
import { ModulePage } from "../../pages/shared/ModulePage";

const modules = [
  {
    path: "ai-mentor",
    eyebrow: "PERSONAL AI TEACHER",
    title: "AI Mentor",
    description:
      "Ask questions, learn concepts and receive personalised guidance.",
  },
  {
    path: "behavior-ai",
    eyebrow: "BEHAVIOUR INTELLIGENCE",
    title: "Behavior AI",
    description:
      "Understand focus patterns, distractions and learning behaviour.",
  },
  {
    path: "digital-activity",
    eyebrow: "CONSENT-BASED MONITORING",
    title: "Digital Activity",
    description:
      "Analyse app, browser, lecture and productive usage patterns.",
  },
  {
    path: "planner",
    eyebrow: "LEARNING EXECUTION",
    title: "Planner",
    description:
      "Organise tasks, study sessions, lectures and revision schedules.",
  },
  {
    path: "subjects",
    eyebrow: "SYLLABUS INTELLIGENCE",
    title: "Subjects",
    description:
      "Track chapters, topics, resources and subject-wise mastery.",
  },
  {
    path: "analytics",
    eyebrow: "LEARNING ANALYTICS",
    title: "Analytics",
    description:
      "Explore progress, performance, consistency and learning trends.",
  },
  {
    path: "prediction",
    eyebrow: "PERFORMANCE FORECASTING",
    title: "Prediction",
    description:
      "Estimate score, rank, confidence and academic risk patterns.",
  },
  {
    path: "memory-engine",
    eyebrow: "RETENTION INTELLIGENCE",
    title: "Memory Engine",
    description:
      "Optimise recall using review queues and forgetting-curve analysis.",
  },
  {
    path: "question-bank",
    eyebrow: "PRACTICE SYSTEM",
    title: "Question Bank",
    description:
      "Practice filtered questions with explanations and performance tracking.",
  },
  {
    path: "mock-tests",
    eyebrow: "ASSESSMENT ENGINE",
    title: "Mock Tests",
    description:
      "Attempt timed assessments and analyse every answer.",
  },
  {
    path: "flashcards",
    eyebrow: "ACTIVE RECALL",
    title: "Flashcards",
    description:
      "Create decks and review concepts through spaced repetition.",
  },
  {
    path: "notes",
    eyebrow: "KNOWLEDGE WORKSPACE",
    title: "Notes",
    description:
      "Write, organise, connect and retrieve your learning notes.",
  },
  {
    path: "research-ai",
    eyebrow: "RESEARCH WORKSPACE",
    title: "Research AI",
    description:
      "Build projects, collect sources and develop structured understanding.",
  },
  {
    path: "community",
    eyebrow: "LEARNING COMMUNITY",
    title: "Community",
    description:
      "Join study groups, discussions, challenges and leaderboards.",
  },
  {
    path: "achievements",
    eyebrow: "PROGRESS REWARDS",
    title: "Achievements",
    description:
      "Track streaks, milestones, badges and learning accomplishments.",
  },
  {
    path: "settings",
    eyebrow: "SYSTEM CONFIGURATION",
    title: "Settings",
    description:
      "Manage account, learning, AI, privacy, devices and billing.",
  },
  {
    path: "subscription",
    eyebrow: "AIMERS MEMBERSHIP",
    title: "Subscription",
    description:
      "Compare plans, limits, premium intelligence and billing options.",
  },
  {
    path: "calendar",
    eyebrow: "ACADEMIC CALENDAR",
    title: "Calendar",
    description:
      "View study plans, tests, classes, reminders and deadlines.",
  },
  {
    path: "focus-room",
    eyebrow: "DEEP WORK",
    title: "Focus Room",
    description:
      "Start distraction-free study sessions with timers and focus tools.",
  },
  {
    path: "billing",
    eyebrow: "ACCOUNT BILLING",
    title: "Billing",
    description:
      "Manage plans, payments, invoices, usage and subscription history.",
  },
  {
    path: "help-support",
    eyebrow: "AIMERS SUPPORT",
    title: "Help & Support",
    description:
      "Find documentation, contact support and submit feedback.",
  },
];

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            index
            element={
              <Navigate
                replace
                to="/dashboard"
              />
            }
          />

          <Route
            path="dashboard"
            element={<DashboardPage />}
          />

          {modules.map((module) => (
            <Route
              key={module.path}
              path={module.path}
              element={
                <ModulePage
                  eyebrow={module.eyebrow}
                  title={module.title}
                  description={
                    module.description
                  }
                />
              }
            />
          ))}

          <Route
            path="*"
            element={
              <Navigate
                replace
                to="/dashboard"
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
