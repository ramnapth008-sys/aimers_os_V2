import { RequireAuth } from "@aimers/auth";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppShell } from "../shell/AppShell";

import { DashboardPage } from "../../pages/dashboard/DashboardPage";

import {
  StudentOnboardingGate,
  StudentOnboardingPage,
} from "../../pages/onboarding";
import {
  SubjectsPage,
} from "../../pages/subjects";
import {
  PlannerPage,
} from "../../pages/planner";

import {
  MockTestsPage,
} from "../../pages/mock-tests";


import {
  PredictionPage,
} from "../../pages/prediction";


import {
  AnalyticsPage,
} from "../../pages/analytics";


import {
  QuestionBankPage,
} from "../../pages/question-bank";






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
    path: "memory-engine",
    eyebrow: "RETENTION INTELLIGENCE",
    title: "Memory Engine",
    description:
      "Optimise recall using review queues and forgetting-curve analysis.",
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
        <Route
          element={
            <RequireAuth
              roles={["STUDENT"]}
              loginUrl="http://localhost:5174/login"
            />
          }
        >
          <Route
            path="onboarding"
            element={
              <StudentOnboardingPage />
            }
          />

          <Route
            element={
              <StudentOnboardingGate />
            }
          >
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

          <Route
            path="subjects"
            element={<SubjectsPage />}
          />

          <Route
            path="planner"
            element={<PlannerPage />}
          />

          <Route
            path="mock-tests"
            element={<MockTestsPage />}
          />

          <Route
            path="prediction"
            element={<PredictionPage />}
          />

          <Route
            path="analytics"
            element={<AnalyticsPage />}
          />

          <Route
            path="question-bank"
            element={<QuestionBankPage />}
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
