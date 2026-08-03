import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { InstitutionShell } from "../shell/InstitutionShell";
import { InstitutionProtectedRoute } from "./InstitutionProtectedRoute";

import { InstitutionLoginPage } from "../../pages/auth/InstitutionLoginPage";
import { InstitutionDashboardPage } from "../../pages/dashboard/InstitutionDashboardPage";
import { InstitutionModulePage } from "../../pages/shared/InstitutionModulePage";

const modules = [
  {
    path: "students",
    eyebrow: "STUDENT DIRECTORY",
    title: "Students",
    description:
      "Manage institution students, enrolments, outcomes and academic risks."
  },
  {
    path: "batches",
    eyebrow: "BATCH OPERATIONS",
    title: "Batches",
    description:
      "Manage student groups, programmes, schedules and batch performance."
  },
  {
    path: "teachers",
    eyebrow: "TEACHER OPERATIONS",
    title: "Teachers",
    description:
      "Manage teachers, assignments, activity and academic follow-up."
  },
  {
    path: "attendance",
    eyebrow: "ATTENDANCE INTELLIGENCE",
    title: "Attendance",
    description:
      "Review class, lecture and institutional attendance patterns."
  },
  {
    path: "performance",
    eyebrow: "ACADEMIC PERFORMANCE",
    title: "Performance",
    description:
      "Analyse student, batch and institution academic outcomes."
  },
  {
    path: "tests",
    eyebrow: "ASSESSMENT OPERATIONS",
    title: "Tests",
    description:
      "Create assessments, manage attempts and analyse test performance."
  },
  {
    path: "content",
    eyebrow: "CONTENT MANAGEMENT",
    title: "Content",
    description:
      "Manage subjects, chapters, resources, lectures and assignments."
  },
  {
    path: "analytics",
    eyebrow: "INSTITUTION ANALYTICS",
    title: "Analytics",
    description:
      "Explore cohort, teacher, student and programme intelligence."
  },
  {
    path: "reports",
    eyebrow: "INSTITUTION REPORTING",
    title: "Reports",
    description:
      "Generate student, batch, teacher and institution reports."
  },
  {
    path: "licences",
    eyebrow: "LICENCE MANAGEMENT",
    title: "Licences",
    description:
      "Manage student, teacher and administrative AIMERS licences."
  },
  {
    path: "billing",
    eyebrow: "INSTITUTION BILLING",
    title: "Billing",
    description:
      "Manage invoices, renewals, usage, contracts and payment history."
  },
  {
    path: "settings",
    eyebrow: "INSTITUTION SETTINGS",
    title: "Settings",
    description:
      "Manage organisation, roles, permissions, integrations and security."
  }
];

export function InstitutionRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <InstitutionLoginPage />
          }
        />

        <Route element={<InstitutionProtectedRoute />}>
          <Route
            element={<InstitutionShell />}
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
            element={
              <InstitutionDashboardPage />
            }
          />

          {modules.map((module) => (
            <Route
              key={module.path}
              path={module.path}
              element={
                <InstitutionModulePage
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
