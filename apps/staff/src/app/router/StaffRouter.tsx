import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { StaffShell } from "../shell/StaffShell";

import { StaffLoginPage } from "../../pages/auth/StaffLoginPage";
import { StaffDashboardPage } from "../../pages/dashboard/StaffDashboardPage";
import { StaffModulePage } from "../../pages/shared/StaffModulePage";

const modules = [
  {
    path: "assigned-students",
    eyebrow: "AUTHORISED LEARNER DIRECTORY",
    title: "Assigned Students",
    description:
      "Review only students assigned to your mentor account."
  },
  {
    path: "student-profile",
    eyebrow: "AUTHORISED STUDENT VIEW",
    title: "Student Profile",
    description:
      "Review learning, tests, behaviour, notes and interventions."
  },
  {
    path: "daily-alerts",
    eyebrow: "ATTENTION INTELLIGENCE",
    title: "Daily Alerts",
    description:
      "Review academic, behavioural and engagement alerts."
  },
  {
    path: "missed-lectures",
    eyebrow: "LECTURE MONITORING",
    title: "Missed Lectures",
    description:
      "Identify incomplete lectures and learning continuity risks."
  },
  {
    path: "backlogs",
    eyebrow: "BACKLOG MANAGEMENT",
    title: "Backlogs",
    description:
      "Review pending lectures, tasks, revision and assessments."
  },
  {
    path: "weak-topics",
    eyebrow: "ACADEMIC RISK ANALYSIS",
    title: "Weak Topics",
    description:
      "Identify weak chapters and topics across assigned students."
  },
  {
    path: "test-performance",
    eyebrow: "ASSESSMENT INTELLIGENCE",
    title: "Test Performance",
    description:
      "Analyse scores, accuracy, mistakes and progress trends."
  },
  {
    path: "study-behavior",
    eyebrow: "CONSENT-AWARE INSIGHTS",
    title: "Study Behavior",
    description:
      "Review authorised focus, consistency and study-pattern summaries."
  },
  {
    path: "interventions",
    eyebrow: "STUDENT IMPROVEMENT",
    title: "Interventions",
    description:
      "Assign, review and measure personalised student interventions."
  },
  {
    path: "mentor-notes",
    eyebrow: "MENTOR DOCUMENTATION",
    title: "Mentor Notes",
    description:
      "Maintain structured notes for authorised student support."
  },
  {
    path: "communication",
    eyebrow: "STUDENT COMMUNICATION",
    title: "Communication",
    description:
      "Manage approved student and parent communication workflows."
  },
  {
    path: "escalations",
    eyebrow: "SUPPORT ESCALATIONS",
    title: "Escalations",
    description:
      "Escalate academic, wellbeing, privacy and technical concerns."
  },
  {
    path: "calendar",
    eyebrow: "MENTOR SCHEDULE",
    title: "Calendar",
    description:
      "Manage sessions, reviews, interventions and follow-ups."
  },
  {
    path: "reports",
    eyebrow: "MENTOR REPORTING",
    title: "Reports",
    description:
      "Create academic, intervention and student-progress reports."
  },
  {
    path: "settings",
    eyebrow: "MENTOR CONFIGURATION",
    title: "Settings",
    description:
      "Manage your profile, notifications and authorised access."
  },
  {
    path: "session-history",
    eyebrow: "ACCESS HISTORY",
    title: "Session History",
    description:
      "Review mentor sessions, activity and account access."
  }
];

export function StaffRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<StaffLoginPage />}
        />

        <Route element={<StaffShell />}>
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
              <StaffDashboardPage />
            }
          />

          {modules.map((module) => (
            <Route
              key={module.path}
              path={module.path}
              element={
                <StaffModulePage
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
