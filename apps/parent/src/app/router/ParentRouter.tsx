import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ParentShell } from "../shell/ParentShell";
import { ParentProtectedRoute } from "./ParentProtectedRoute";

import { ParentLoginPage } from "../../pages/auth/ParentLoginPage";
import { ParentDashboardPage } from "../../pages/dashboard/ParentDashboardPage";
import { ParentModulePage } from "../../pages/shared/ParentModulePage";

const modules = [
  {
    path: "child-progress",
    eyebrow: "ACADEMIC PROGRESS",
    title: "Child Progress",
    description:
      "Review subject mastery, completion, consistency and academic trends."
  },
  {
    path: "attendance",
    eyebrow: "LEARNING ATTENDANCE",
    title: "Attendance",
    description:
      "Review classes, planned study sessions and learning participation."
  },
  {
    path: "study-time",
    eyebrow: "STUDY CONSISTENCY",
    title: "Study Time",
    description:
      "Understand healthy study duration, consistency and weekly trends."
  },
  {
    path: "test-results",
    eyebrow: "ASSESSMENT SUMMARY",
    title: "Test Results",
    description:
      "Review scores, accuracy, improvement and major academic patterns."
  },
  {
    path: "weak-topics",
    eyebrow: "ACADEMIC SUPPORT",
    title: "Weak Topics",
    description:
      "See the topics currently receiving additional revision support."
  },
  {
    path: "alerts",
    eyebrow: "PARENT AWARENESS",
    title: "Alerts",
    description:
      "Review meaningful academic, attendance and wellbeing-related updates."
  },
  {
    path: "reports",
    eyebrow: "PROGRESS REPORTING",
    title: "Reports",
    description:
      "View and download weekly, monthly and mentor progress summaries."
  },
  {
    path: "subscriptions",
    eyebrow: "ACCOUNT SUBSCRIPTION",
    title: "Subscription",
    description:
      "Manage the AIMERS plan, payments, invoices and renewal settings."
  },
  {
    path: "privacy",
    eyebrow: "STUDENT PRIVACY",
    title: "Privacy",
    description:
      "Understand parent access boundaries, consent and protected student data."
  },
  {
    path: "settings",
    eyebrow: "PARENT SETTINGS",
    title: "Settings",
    description:
      "Manage profile, notifications, linked students and account security."
  }
];

export function ParentRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<ParentLoginPage />}
        />

        <Route element={<ParentProtectedRoute />}>
          <Route element={<ParentShell />}>
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
            element={<ParentDashboardPage />}
          />

          {modules.map((module) => (
            <Route
              key={module.path}
              path={module.path}
              element={
                <ParentModulePage
                  eyebrow={module.eyebrow}
                  title={module.title}
                  description={module.description}
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
