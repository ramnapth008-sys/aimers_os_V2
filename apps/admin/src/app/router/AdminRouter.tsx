import { RequireAuth } from "@aimers/auth";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AdminShell } from "../shell/AdminShell";

import { AdminLoginPage } from "../../pages/auth/AdminLoginPage";

import { AdminOverviewPage } from "../../pages/overview/AdminOverviewPage";
import { AdminModulePage } from "../../pages/shared/AdminModulePage";

const modules = [
  {
    path: "revenue",
    eyebrow: "FINANCIAL INTELLIGENCE",
    title: "Revenue",
    description:
      "Track MRR, ARR, conversion, refunds, churn and revenue forecasts.",
  },
  {
    path: "subscriptions",
    eyebrow: "SUBSCRIPTION OPERATIONS",
    title: "Subscriptions",
    description:
      "Manage plans, trials, renewals, invoices, coupons and failed payments.",
  },
  {
    path: "customers",
    eyebrow: "CUSTOMER INTELLIGENCE",
    title: "Customers",
    description:
      "Understand customer accounts, subscriptions, support and lifecycle events.",
  },
  {
    path: "students",
    eyebrow: "LEARNER OPERATIONS",
    title: "Students",
    description:
      "Analyse engagement, outcomes, risks and authorised student profiles.",
  },
  {
    path: "student-profile",
    eyebrow: "AUTHORISED STUDENT VIEW",
    title: "Student Profile",
    description:
      "Review learning, tests, behaviour, interventions and consent-aware activity.",
  },
  {
    path: "cohorts",
    eyebrow: "COHORT INTELLIGENCE",
    title: "Cohorts",
    description:
      "Create segments and compare performance, retention and behaviour patterns.",
  },
  {
    path: "rankers",
    eyebrow: "TOP-PERFORMER RESEARCH",
    title: "Rankers",
    description:
      "Study high-performing student journeys, habits and outcome patterns.",
  },
  {
    path: "mentors",
    eyebrow: "MENTOR OPERATIONS",
    title: "Mentors",
    description:
      "Manage mentors, assignments, performance and authorised learner access.",
  },
  {
    path: "staff",
    eyebrow: "TEAM OPERATIONS",
    title: "Staff",
    description:
      "Manage company roles, permissions, assignments and access history.",
  },
  {
    path: "learning-analytics",
    eyebrow: "ACADEMIC INTELLIGENCE",
    title: "Learning Analytics",
    description:
      "Analyse subjects, lectures, tests, retention and weak-topic trends.",
  },
  {
    path: "product-analytics",
    eyebrow: "PRODUCT INTELLIGENCE",
    title: "Product Analytics",
    description:
      "Measure adoption, funnels, retention, sessions and feature performance.",
  },
  {
    path: "behavior-analytics",
    eyebrow: "BEHAVIOUR INTELLIGENCE",
    title: "Behavior Analytics",
    description:
      "Study aggregate focus, distraction and learning behaviour patterns.",
  },
  {
    path: "digital-activity",
    eyebrow: "CONSENT-AWARE ACTIVITY",
    title: "Digital Activity",
    description:
      "Review aggregated and pseudonymised activity intelligence.",
  },
  {
    path: "ai-operations",
    eyebrow: "AI PLATFORM OPERATIONS",
    title: "AI Operations",
    description:
      "Track models, prompts, usage, cost, evaluations, quality and safety.",
  },
  {
    path: "predictions",
    eyebrow: "FORECASTING OPERATIONS",
    title: "Predictions",
    description:
      "Evaluate score, rank, risk and confidence prediction systems.",
  },
  {
    path: "experiments",
    eyebrow: "PRODUCT EXPERIMENTATION",
    title: "Experiments",
    description:
      "Create controlled experiments and compare intervention outcomes.",
  },
  {
    path: "interventions",
    eyebrow: "STUDENT OPTIMISATION",
    title: "Interventions",
    description:
      "Create, assign and measure personalised improvement interventions.",
  },
  {
    path: "content-management",
    eyebrow: "CONTENT OPERATIONS",
    title: "Content Management",
    description:
      "Manage subjects, syllabus resources, lectures and learning content.",
  },
  {
    path: "question-bank",
    eyebrow: "QUESTION OPERATIONS",
    title: "Question Bank",
    description:
      "Manage questions, solutions, classifications and quality workflows.",
  },
  {
    path: "mock-tests",
    eyebrow: "ASSESSMENT OPERATIONS",
    title: "Mock Tests",
    description:
      "Create test series, analyse attempts and maintain assessment quality.",
  },
  {
    path: "community",
    eyebrow: "COMMUNITY OPERATIONS",
    title: "Community",
    description:
      "Moderate posts, discussions, study groups and learning challenges.",
  },
  {
    path: "support",
    eyebrow: "CUSTOMER SUPPORT",
    title: "Support",
    description:
      "Manage tickets, escalations, response times and customer outcomes.",
  },
  {
    path: "notifications",
    eyebrow: "COMMUNICATION OPERATIONS",
    title: "Notifications",
    description:
      "Manage transactional, learning, billing and system communication.",
  },
  {
    path: "privacy",
    eyebrow: "PRIVACY OPERATIONS",
    title: "Privacy",
    description:
      "Manage age verification, consent, exports, deletion and retention.",
  },
  {
    path: "consents",
    eyebrow: "CONSENT MANAGEMENT",
    title: "Consents",
    description:
      "Review consent grants, versions, scopes, expiry and revocation.",
  },
  {
    path: "audit-logs",
    eyebrow: "ACCESS ACCOUNTABILITY",
    title: "Audit Logs",
    description:
      "Review sensitive access, staff actions and administrative changes.",
  },
  {
    path: "data-requests",
    eyebrow: "DATA RIGHTS",
    title: "Data Requests",
    description:
      "Manage exports, corrections, restrictions and deletion requests.",
  },
  {
    path: "security",
    eyebrow: "SECURITY OPERATIONS",
    title: "Security",
    description:
      "Review sessions, access control, incidents and security events.",
  },
  {
    path: "system-health",
    eyebrow: "PLATFORM OPERATIONS",
    title: "System Health",
    description:
      "Monitor APIs, databases, queues, jobs, storage and realtime systems.",
  },
  {
    path: "feature-flags",
    eyebrow: "CONTROLLED RELEASES",
    title: "Feature Flags",
    description:
      "Manage rollouts, experiments, environments and emergency controls.",
  },
  {
    path: "settings",
    eyebrow: "COMPANY CONFIGURATION",
    title: "Settings",
    description:
      "Configure organisation, billing, integrations, security and system defaults.",
  },
];

export function AdminRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<AdminLoginPage />}
        />

        <Route
          element={
            <RequireAuth
              roles={["ADMIN", "SUPER_ADMIN"]}
              loginUrl="/login"
            />
          }
        >
          <Route element={<AdminShell />}>
          <Route
            index
            element={
              <Navigate
                replace
                to="/overview"
              />
            }
          />

          <Route
            path="overview"
            element={<AdminOverviewPage />}
          />

          {modules.map((module) => (
            <Route
              key={module.path}
              path={module.path}
              element={
                <AdminModulePage
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
                to="/overview"
              />
            }
          />
        </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
