#!/usr/bin/env bash

set -euo pipefail

echo "Creating AIMERS OS mentor and staff portal..."

mkdir -p \
  apps/staff/src/app/router \
  apps/staff/src/app/shell \
  apps/staff/src/components/navigation \
  apps/staff/src/data \
  apps/staff/src/pages/auth \
  apps/staff/src/pages/dashboard \
  apps/staff/src/pages/shared \
  apps/staff/src/styles

# ============================================================
# PACKAGE CONFIGURATION
# ============================================================

cat > apps/staff/package.json <<'EOF'
{
  "name": "@aimers/staff",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "AIMERS OS mentor and staff portal",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5176",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  }
}
EOF

cat > apps/staff/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "types": [
      "vite/client"
    ]
  },
  "include": [
    "src",
    "vite.config.ts"
  ]
}
EOF

cat > apps/staff/vite.config.ts <<'EOF'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176
  }
});
EOF

cat > apps/staff/index.html <<'EOF'
<!doctype html>

<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />

    <meta
      name="theme-color"
      content="#030510"
    />

    <title>
      AIMERS OS — Mentor Portal
    </title>
  </head>

  <body>
    <div id="root"></div>

    <script
      type="module"
      src="/src/main.tsx"
    ></script>
  </body>
</html>
EOF

# ============================================================
# NAVIGATION
# ============================================================

cat > apps/staff/src/data/navigation.ts <<'EOF'
import type { LucideIcon } from "lucide-react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Clock3,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  NotebookPen,
  Settings,
  Target,
  UserRoundCheck,
  Users,
  Zap,
} from "lucide-react";

export interface StaffNavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface StaffNavigationGroup {
  label: string;
  items: StaffNavigationItem[];
}

export const staffNavigation: StaffNavigationGroup[] = [
  {
    label: "MENTOR WORKSPACE",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard
      },
      {
        label: "Assigned Students",
        path: "/assigned-students",
        icon: Users
      },
      {
        label: "Daily Alerts",
        path: "/daily-alerts",
        icon: AlertTriangle
      }
    ]
  },
  {
    label: "ACADEMIC MONITORING",
    items: [
      {
        label: "Missed Lectures",
        path: "/missed-lectures",
        icon: BookOpenCheck
      },
      {
        label: "Backlogs",
        path: "/backlogs",
        icon: ListChecks
      },
      {
        label: "Weak Topics",
        path: "/weak-topics",
        icon: Target
      },
      {
        label: "Test Performance",
        path: "/test-performance",
        icon: BarChart3
      },
      {
        label: "Study Behavior",
        path: "/study-behavior",
        icon: Activity
      }
    ]
  },
  {
    label: "STUDENT SUPPORT",
    items: [
      {
        label: "Interventions",
        path: "/interventions",
        icon: Zap
      },
      {
        label: "Mentor Notes",
        path: "/mentor-notes",
        icon: NotebookPen
      },
      {
        label: "Communication",
        path: "/communication",
        icon: MessageSquareText
      },
      {
        label: "Escalations",
        path: "/escalations",
        icon: UserRoundCheck
      }
    ]
  },
  {
    label: "TOOLS",
    items: [
      {
        label: "Calendar",
        path: "/calendar",
        icon: CalendarDays
      },
      {
        label: "Reports",
        path: "/reports",
        icon: FileText
      },
      {
        label: "Settings",
        path: "/settings",
        icon: Settings
      },
      {
        label: "Session History",
        path: "/session-history",
        icon: Clock3
      }
    ]
  }
];
EOF

# ============================================================
# SIDEBAR
# ============================================================

cat > apps/staff/src/components/navigation/StaffSidebar.tsx <<'EOF'
import {
  Brain,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { staffNavigation } from "../../data/navigation";

interface StaffSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function StaffSidebar({
  open,
  onClose,
}: StaffSidebarProps) {
  return (
    <>
      <button
        className={
          open
            ? "staff-sidebar-backdrop visible"
            : "staff-sidebar-backdrop"
        }
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          open
            ? "staff-sidebar open"
            : "staff-sidebar"
        }
      >
        <header className="staff-brand">
          <span>
            <Brain size={25} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Mentor Intelligence
            </small>
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <section className="staff-access-card">
          <span>
            <ShieldCheck size={15} />
          </span>

          <div>
            <small>
              AUTHORISED ACCESS
            </small>

            <strong>
              Assigned students only
            </strong>
          </div>

          <i>LIVE</i>
        </section>

        <nav className="staff-navigation">
          {staffNavigation.map((group) => (
            <section key={group.label}>
              <h2>{group.label}</h2>

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      isActive
                        ? "staff-nav-link active"
                        : "staff-nav-link"
                    }
                    onClick={onClose}
                  >
                    <Icon size={16} />

                    <span>{item.label}</span>

                    <i />
                  </NavLink>
                );
              })}
            </section>
          ))}
        </nav>

        <footer className="staff-profile">
          <div className="staff-avatar">
            AM
          </div>

          <div>
            <strong>
              Anjali Menon
            </strong>

            <small>
              Senior Academic Mentor
            </small>
          </div>

          <button
            type="button"
            aria-label="Log out"
          >
            <LogOut size={15} />
          </button>
        </footer>
      </aside>
    </>
  );
}
EOF

# ============================================================
# TOPBAR
# ============================================================

cat > apps/staff/src/components/navigation/StaffTopbar.tsx <<'EOF'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";

interface StaffTopbarProps {
  onOpenSidebar: () => void;
}

export function StaffTopbar({
  onOpenSidebar,
}: StaffTopbarProps) {
  return (
    <header className="staff-topbar">
      <div className="staff-topbar-title">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1>Mentor Dashboard</h1>

          <p>
            Assigned learner progress,
            alerts and interventions.
          </p>
        </div>
      </div>

      <button
        className="staff-search"
        type="button"
      >
        <Search size={16} />

        <span>
          Search assigned students...
        </span>

        <kbd>⌘ K</kbd>
      </button>

      <div className="staff-topbar-actions">
        <span className="staff-security-status">
          <ShieldCheck size={15} />
          Access logged
        </span>

        <button
          className="staff-topbar-icon"
          type="button"
          aria-label="Calendar"
        >
          <CalendarDays size={17} />
        </button>

        <button
          className="staff-topbar-icon"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span>7</span>
        </button>

        <button
          className="staff-account"
          type="button"
        >
          <span>AM</span>

          <div>
            <strong>
              Anjali Menon
            </strong>

            <small>
              Senior Mentor
            </small>
          </div>

          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
EOF

# ============================================================
# APPLICATION SHELL
# ============================================================

cat > apps/staff/src/app/shell/StaffShell.tsx <<'EOF'
import {
  CircleCheck,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import { StaffSidebar } from "../../components/navigation/StaffSidebar";
import { StaffTopbar } from "../../components/navigation/StaffTopbar";

export function StaffShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="staff-app-shell">
      <StaffSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="staff-main-column">
        <StaffTopbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="staff-page-content">
          <Outlet />
        </main>

        <footer className="staff-system-footer">
          <span>
            <CircleCheck size={13} />
            Mentor systems operational
          </span>

          <span>
            <ShieldCheck size={13} />
            Student access is audited
          </span>

          <strong>
            AIMERS Staff v2.0.0
          </strong>
        </footer>
      </div>
    </div>
  );
}
EOF

# ============================================================
# STAFF DASHBOARD
# ============================================================

cat > apps/staff/src/pages/dashboard/StaffDashboardPage.tsx <<'EOF'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  Zap,
} from "lucide-react";

import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import "./staff-dashboard.css";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: string;
}

const students = [
  {
    initials: "AK",
    name: "Akhil Prasad",
    target: "NEET 2027",
    study: "6h 42m",
    accuracy: "78%",
    risk: "High",
  },
  {
    initials: "DR",
    name: "Diya Raj",
    target: "NEET 2027",
    study: "7h 10m",
    accuracy: "84%",
    risk: "Low",
  },
  {
    initials: "SK",
    name: "Sanjay Kumar",
    target: "NEET 2027",
    study: "4h 18m",
    accuracy: "69%",
    risk: "Medium",
  },
  {
    initials: "NM",
    name: "Nayana Menon",
    target: "NEET 2027",
    study: "8h 02m",
    accuracy: "87%",
    risk: "Low",
  },
];

const alerts = [
  {
    title: "Akhil missed two lectures",
    detail:
      "Electrostatics lectures remain incomplete.",
    time: "12 minutes ago",
    tone: "danger",
  },
  {
    title: "Sanjay accuracy decreased",
    detail:
      "Physics accuracy fell by 9% this week.",
    time: "34 minutes ago",
    tone: "warning",
  },
  {
    title: "Diya completed intervention",
    detail:
      "Organic Chemistry revision plan completed.",
    time: "1 hour ago",
    tone: "success",
  },
  {
    title: "Nayana reached 30-day streak",
    detail:
      "New consistency milestone achieved.",
    time: "2 hours ago",
    tone: "violet",
  },
];

const interventions = [
  {
    student: "Akhil Prasad",
    action: "Focus recovery plan",
    progress: 62,
    outcome: "+18% focus",
  },
  {
    student: "Sanjay Kumar",
    action: "Physics accuracy plan",
    progress: 45,
    outcome: "In progress",
  },
  {
    student: "Diya Raj",
    action: "Organic revision queue",
    progress: 100,
    outcome: "+11% accuracy",
  },
];

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: MetricCardProps) {
  return (
    <article
      className={`staff-metric-card staff-tone-${tone}`}
    >
      <header>
        <span>{icon}</span>
        <small>{label}</small>

        <button type="button">
          <ArrowUpRight size={13} />
        </button>
      </header>

      <strong>{value}</strong>

      <p>{detail}</p>

      <footer>
        <TrendingUp size={13} />
        Updated today
      </footer>
    </article>
  );
}

function StaffPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`staff-panel ${className}`}
    >
      <header className="staff-panel-heading">
        <div>
          <h2>{title}</h2>

          {description && (
            <p>{description}</p>
          )}
        </div>

        {action}
      </header>

      {children}
    </article>
  );
}

export function StaffDashboardPage() {
  return (
    <div className="staff-dashboard-page">
      <section className="staff-dashboard-heading">
        <div>
          <span>
            <Sparkles size={14} />
            MONDAY MENTOR BRIEF
          </span>

          <h1>
            Good afternoon, Anjali.
          </h1>

          <p>
            Three students need attention
            and two interventions are due
            for review today.
          </p>
        </div>

        <div>
          <Link to="/reports">
            <FileText size={14} />
            Generate report
          </Link>

          <Link to="/interventions">
            <Zap size={14} />
            New intervention
          </Link>
        </div>
      </section>

      <section className="staff-metric-grid">
        <MetricCard
          label="ASSIGNED STUDENTS"
          value="42"
          detail="38 active this week"
          icon={<Users size={17} />}
          tone="violet"
        />

        <MetricCard
          label="STUDENTS AT RISK"
          value="7"
          detail="3 require immediate action"
          icon={<AlertTriangle size={17} />}
          tone="danger"
        />

        <MetricCard
          label="ACTIVE INTERVENTIONS"
          value="16"
          detail="5 reviews due today"
          icon={<Zap size={17} />}
          tone="blue"
        />

        <MetricCard
          label="AVERAGE ACCURACY"
          value="76.8%"
          detail="Up 4.2% this month"
          icon={<Target size={17} />}
          tone="green"
        />

        <MetricCard
          label="MENTOR RESPONSE"
          value="18m"
          detail="Average response time"
          icon={
            <MessageSquareText size={17} />
          }
          tone="cyan"
        />
      </section>

      <section className="staff-primary-grid">
        <StaffPanel
          title="Assigned Student Overview"
          description="Current learning and risk status"
          action={
            <Link to="/assigned-students">
              View all students
            </Link>
          }
        >
          <div className="student-table">
            <header>
              <span>Student</span>
              <span>Target</span>
              <span>Study Today</span>
              <span>Accuracy</span>
              <span>Risk</span>
              <span />
            </header>

            {students.map((student) => (
              <section key={student.name}>
                <span>
                  <i>{student.initials}</i>

                  <strong>
                    {student.name}
                  </strong>
                </span>

                <span>{student.target}</span>

                <span>
                  <Clock3 size={12} />
                  {student.study}
                </span>

                <strong>
                  {student.accuracy}
                </strong>

                <span>
                  <b
                    className={student.risk.toLowerCase()}
                  >
                    {student.risk}
                  </b>
                </span>

                <Link to="/student-profile">
                  <ArrowRight size={14} />
                </Link>
              </section>
            ))}
          </div>
        </StaffPanel>

        <StaffPanel
          title="Daily Alerts"
          description="AI and system-generated attention items"
          action={
            <Link to="/daily-alerts">
              View all
            </Link>
          }
        >
          <div className="mentor-alert-list">
            {alerts.map((alert) => (
              <section key={alert.title}>
                <span className={alert.tone}>
                  {alert.tone === "success" ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <AlertTriangle size={15} />
                  )}
                </span>

                <div>
                  <strong>
                    {alert.title}
                  </strong>

                  <p>{alert.detail}</p>

                  <small>{alert.time}</small>
                </div>
              </section>
            ))}
          </div>
        </StaffPanel>
      </section>

      <section className="staff-secondary-grid">
        <StaffPanel
          title="Study Performance"
          description="Assigned-student weekly trend"
          action={
            <button type="button">
              This week
            </button>
          }
        >
          <div className="mentor-chart">
            <div className="mentor-chart-axis">
              <span>90%</span>
              <span>75%</span>
              <span>60%</span>
              <span>45%</span>
            </div>

            <div className="mentor-chart-plot">
              <svg
                viewBox="0 0 520 190"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="staffArea"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity="0.48"
                    />

                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 145 L85 129 L170 135 L255 90 L340 102 L425 64 L520 48 L520 190 L0 190 Z"
                  fill="url(#staffArea)"
                />

                <polyline
                  points="0,145 85,129 170,135 255,90 340,102 425,64 520,48"
                  fill="none"
                  stroke="#9b79ff"
                  strokeWidth="4"
                />

                <polyline
                  points="0,165 85,151 170,157 255,132 340,140 425,106 520,96"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                />
              </svg>

              <div>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          <footer className="mentor-chart-legend">
            <span>
              <i />
              Average accuracy
            </span>

            <span>
              <i />
              Study consistency
            </span>
          </footer>
        </StaffPanel>

        <StaffPanel
          title="Academic Attention"
          description="Current pending learning problems"
        >
          <div className="attention-grid">
            <Link to="/missed-lectures">
              <span>
                <BookOpenCheck size={18} />
              </span>

              <div>
                <strong>18</strong>
                <small>
                  Missed lectures
                </small>
              </div>

              <ArrowRight size={14} />
            </Link>

            <Link to="/backlogs">
              <span>
                <Clock3 size={18} />
              </span>

              <div>
                <strong>27</strong>
                <small>
                  Active backlogs
                </small>
              </div>

              <ArrowRight size={14} />
            </Link>

            <Link to="/weak-topics">
              <span>
                <Target size={18} />
              </span>

              <div>
                <strong>36</strong>
                <small>
                  Critical weak topics
                </small>
              </div>

              <ArrowRight size={14} />
            </Link>

            <Link to="/test-performance">
              <span>
                <BarChart3 size={18} />
              </span>

              <div>
                <strong>9</strong>
                <small>
                  Low test scores
                </small>
              </div>

              <ArrowRight size={14} />
            </Link>
          </div>
        </StaffPanel>

        <StaffPanel
          title="Mentor Effectiveness"
          description="Your current support outcomes"
        >
          <div className="mentor-effectiveness">
            <div className="effectiveness-ring">
              <span>
                <strong>88%</strong>
                <small>
                  Mentor score
                </small>
              </span>
            </div>

            <div>
              <section>
                <span>
                  Students improved
                </span>
                <strong>34/42</strong>
              </section>

              <section>
                <span>
                  Intervention success
                </span>
                <strong>81%</strong>
              </section>

              <section>
                <span>
                  Response compliance
                </span>
                <strong>96%</strong>
              </section>
            </div>
          </div>

          <Link
            className="staff-full-link"
            to="/reports"
          >
            Open mentor performance report
          </Link>
        </StaffPanel>
      </section>

      <section className="staff-lower-grid">
        <StaffPanel
          title="Active Interventions"
          description="Current student-improvement plans"
          action={
            <Link to="/interventions">
              Intervention centre
            </Link>
          }
        >
          <div className="active-intervention-list">
            {interventions.map(
              (intervention) => (
                <section
                  key={intervention.student}
                >
                  <span>
                    <Zap size={15} />
                  </span>

                  <div>
                    <strong>
                      {intervention.student}
                    </strong>

                    <small>
                      {intervention.action}
                    </small>
                  </div>

                  <div className="intervention-progress">
                    <header>
                      <span>
                        {intervention.progress}%
                      </span>

                      <strong>
                        {intervention.outcome}
                      </strong>
                    </header>

                    <div>
                      <i
                        style={{
                          width: `${intervention.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </section>
              ),
            )}
          </div>
        </StaffPanel>

        <StaffPanel
          title="AI Mentor Assistant"
          description="Support for authorised mentor work"
          className="staff-ai-panel"
          action={<Brain size={18} />}
        >
          <div className="mentor-ai-message">
            <span>
              <Brain size={18} />
            </span>

            <div>
              <strong>
                Suggested priority
              </strong>

              <p>
                Review Akhil's missed
                Electrostatics lectures before
                assigning another Physics test.
              </p>
            </div>
          </div>

          <div className="mentor-ai-message">
            <span>
              <Activity size={18} />
            </span>

            <div>
              <strong>
                Behaviour insight
              </strong>

              <p>
                Sanjay's study consistency is
                stable, but long evening
                sessions are reducing accuracy.
              </p>
            </div>
          </div>

          <button type="button">
            Ask Mentor AI
            <ArrowRight size={14} />
          </button>
        </StaffPanel>
      </section>

      <section className="staff-audit-strip">
        <div>
          <UserRoundCheck size={18} />

          <span>
            <strong>
              Access policy active
            </strong>

            <small>
              You can view only assigned or
              explicitly authorised students.
              Sensitive access is logged.
            </small>
          </span>
        </div>

        <Link to="/settings">
          Review permissions
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
EOF

# ============================================================
# GENERIC MODULE PAGE
# ============================================================

cat > apps/staff/src/pages/shared/StaffModulePage.tsx <<'EOF'
import {
  ArrowRight,
  Brain,
  FileText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

interface StaffModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function StaffModulePage({
  eyebrow,
  title,
  description,
}: StaffModulePageProps) {
  return (
    <div className="staff-module-page">
      <header className="staff-module-hero">
        <div>
          <span>
            <Sparkles size={13} />
            {eyebrow}
          </span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>

        <button type="button">
          Create mentor report
          <ArrowRight size={14} />
        </button>
      </header>

      <section className="staff-module-metrics">
        <article>
          <span>
            <Users size={18} />
          </span>

          <div>
            <small>ACCESS SCOPE</small>
            <strong>
              Assigned students
            </strong>
          </div>
        </article>

        <article>
          <span>
            <Brain size={18} />
          </span>

          <div>
            <small>AI SUPPORT</small>
            <strong>
              Mentor AI connected
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FileText size={18} />
          </span>

          <div>
            <small>REPORTING</small>
            <strong>
              Data synchronised
            </strong>
          </div>
        </article>

        <article>
          <span>
            <ShieldCheck size={18} />
          </span>

          <div>
            <small>SECURITY</small>
            <strong>
              Access audited
            </strong>
          </div>
        </article>
      </section>

      <section className="staff-module-content">
        <article>
          <header>
            <div>
              <span>MENTOR WORKSPACE</span>

              <h2>
                {title} Overview
              </h2>
            </div>

            <button type="button">
              Configure view
            </button>
          </header>

          <div className="staff-module-placeholder">
            <span>
              <Brain size={43} />
            </span>

            <h3>
              {title} workspace prepared
            </h3>

            <p>
              The responsive mentor interface,
              permissions boundary and module
              layout are ready. Real student
              information will be connected
              through the authorised API.
            </p>
          </div>
        </article>

        <aside>
          <span>AI MENTOR SUMMARY</span>

          <h2>
            Student-support intelligence is
            ready.
          </h2>

          <p>
            AIMERS will combine academic
            progress, test outcomes, study
            behaviour and interventions while
            respecting role and consent rules.
          </p>

          <button type="button">
            Open documentation
          </button>
        </aside>
      </section>
    </div>
  );
}
EOF

# ============================================================
# LOGIN PAGE
# ============================================================

cat > apps/staff/src/pages/auth/StaffLoginPage.tsx <<'EOF'
import {
  ArrowRight,
  Brain,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Link } from "react-router-dom";

export function StaffLoginPage() {
  return (
    <div className="staff-login-page">
      <section className="staff-login-brand-panel">
        <Link to="/login">
          <span>
            <Brain size={27} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Mentor Intelligence
            </small>
          </div>
        </Link>

        <div>
          <span>
            AUTHORISED STAFF ACCESS
          </span>

          <h1>
            Support every student with better
            information.
          </h1>

          <p>
            Review assigned learners,
            understand academic risks and
            coordinate evidence-based
            interventions.
          </p>

          <section>
            <ShieldCheck size={18} />

            <div>
              <strong>
                Permission-aware access
              </strong>

              <small>
                Sensitive views and actions are
                securely audited.
              </small>
            </div>
          </section>
        </div>
      </section>

      <section className="staff-login-form-panel">
        <form
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <span>
            AIMERS MENTOR PORTAL
          </span>

          <h2>Staff sign in</h2>

          <p>
            Use your authorised AIMERS staff
            account.
          </p>

          <label>
            <span>Email address</span>

            <div>
              <Mail size={16} />

              <input
                type="email"
                placeholder="mentor@aimers.ai"
              />
            </div>
          </label>

          <label>
            <span>Password</span>

            <div>
              <LockKeyhole size={16} />

              <input
                type="password"
                placeholder="Enter password"
              />
            </div>
          </label>

          <button type="submit">
            Sign in securely
            <ArrowRight size={15} />
          </button>

          <small>
            This portal is restricted to
            authorised AIMERS staff.
          </small>
        </form>
      </section>
    </div>
  );
}
EOF

# ============================================================
# ROUTER
# ============================================================

cat > apps/staff/src/app/router/StaffRouter.tsx <<'EOF'
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
EOF

cat > apps/staff/src/app/App.tsx <<'EOF'
import { StaffRouter } from "./router/StaffRouter";

export function App() {
  return <StaffRouter />;
}
EOF

cat > apps/staff/src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";

import "./styles/index.css";

const root = document.getElementById(
  "root",
);

if (!root) {
  throw new Error(
    "AIMERS staff root element was not found.",
  );
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

cat > apps/staff/src/vite-env.d.ts <<'EOF'
/// <reference types="vite/client" />
EOF

# ============================================================
# GLOBAL STYLES
# ============================================================

cat > apps/staff/src/styles/index.css <<'EOF'
@import "@aimers/design-tokens/tokens.css";
@import "./staff.css";
@import "../pages/dashboard/staff-dashboard.css";
EOF

cat > apps/staff/src/styles/staff.css <<'EOF'
* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  min-height: 100%;
  background: var(--aimers-bg-primary);
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  overflow-x: hidden;
  color: var(--aimers-text-primary);
  background:
    radial-gradient(
      circle at 90% 3%,
      rgba(92, 48, 190, 0.15),
      transparent 27%
    ),
    var(--aimers-bg-primary);
  font-family:
    Inter,
    Satoshi,
    ui-sans-serif,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 14px;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
}

svg {
  display: block;
}

.staff-app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns:
    238px minmax(0, 1fr);
}

.staff-sidebar {
  position: sticky;
  z-index: 70;
  top: 0;
  display: grid;
  height: 100vh;
  grid-template-rows:
    auto auto minmax(0, 1fr) auto;
  border-right: 1px solid
    var(--aimers-border-soft);
  padding: 14px 12px;
  background:
    linear-gradient(
      180deg,
      rgba(7, 11, 27, 0.99),
      rgba(4, 7, 18, 0.99)
    );
}

.staff-brand {
  display: grid;
  grid-template-columns: 39px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 4px 5px 15px;
}

.staff-brand > span {
  display: grid;
  width: 39px;
  height: 39px;
  place-items: center;
  border: 1px solid
    rgba(161, 104, 255, 0.35);
  border-radius: 13px;
  color: #c98bff;
  background:
    rgba(130, 63, 221, 0.13);
  box-shadow:
    0 0 23px rgba(139, 92, 246, 0.18);
}

.staff-brand strong {
  display: block;
  font-size: 14px;
  letter-spacing: 0.14em;
}

.staff-brand strong i {
  color: #a56dff;
  font-style: normal;
}

.staff-brand small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.staff-brand > button {
  display: none;
  width: 31px;
  height: 31px;
  place-items: center;
  border: 0;
  border-radius: 9px;
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.035);
}

.staff-access-card {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 8px;
  border: 1px solid
    rgba(139, 92, 246, 0.18);
  border-radius: 12px;
  margin-bottom: 14px;
  padding: 9px;
  background:
    rgba(118, 69, 201, 0.07);
}

.staff-access-card > span {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border-radius: 8px;
  color: #c08cff;
  background:
    rgba(139, 92, 246, 0.11);
}

.staff-access-card small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.1em;
}

.staff-access-card strong {
  display: block;
  margin-top: 3px;
  font-size: 8px;
}

.staff-access-card > i {
  border-radius: 999px;
  padding: 3px 6px;
  color: #5be1a1;
  background:
    rgba(34, 197, 94, 0.08);
  font-size: 6px;
  font-style: normal;
}

.staff-navigation {
  overflow-y: auto;
  padding-right: 3px;
}

.staff-navigation section {
  margin-bottom: 13px;
}

.staff-navigation h2 {
  margin: 0 9px 6px;
  color: #515a77;
  font-size: 7px;
  letter-spacing: 0.13em;
}

.staff-nav-link {
  display: grid;
  min-height: 37px;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 9px;
  margin-bottom: 2px;
  padding: 0 9px;
  color: #aeb5ca;
  font-size: 10px;
  text-decoration: none;
}

.staff-nav-link:hover {
  color: white;
  background:
    rgba(139, 92, 246, 0.055);
}

.staff-nav-link.active {
  border-color:
    rgba(145, 93, 242, 0.15);
  color: white;
  background:
    linear-gradient(
      90deg,
      rgba(103, 50, 191, 0.54),
      rgba(88, 44, 171, 0.08)
    );
  box-shadow:
    inset 2px 0 #a45cff;
}

.staff-nav-link > i {
  display: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c07aff;
  box-shadow: 0 0 8px #a855f7;
}

.staff-nav-link.active > i {
  display: block;
}

.staff-profile {
  display: grid;
  grid-template-columns:
    34px 1fr 30px;
  align-items: center;
  gap: 8px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 12px;
  margin-top: 9px;
  padding: 8px;
  background:
    rgba(255, 255, 255, 0.023);
}

.staff-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  color: #e7dbff;
  background:
    linear-gradient(
      135deg,
      #4f2a89,
      #1e3f64
    );
  font-size: 9px;
  font-weight: 800;
}

.staff-profile strong {
  display: block;
  font-size: 9px;
}

.staff-profile small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.staff-profile button {
  display: grid;
  width: 29px;
  height: 29px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: var(--aimers-text-muted);
  background:
    rgba(255, 255, 255, 0.03);
}

.staff-sidebar-backdrop {
  display: none;
}

.staff-main-column {
  min-width: 0;
}

.staff-topbar {
  position: sticky;
  z-index: 50;
  top: 0;
  display: grid;
  min-height: 72px;
  grid-template-columns:
    minmax(240px, 0.8fr)
    minmax(300px, 1.1fr)
    auto;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid
    var(--aimers-border-soft);
  padding: 9px 17px;
  background:
    rgba(3, 6, 17, 0.91);
  backdrop-filter: blur(20px);
}

.staff-topbar-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.staff-topbar-title > button {
  display: none;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 10px;
  color: var(--aimers-text-secondary);
  background:
    rgba(255, 255, 255, 0.025);
}

.staff-topbar-title h1 {
  margin: 0;
  font-size: 15px;
}

.staff-topbar-title p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.staff-search {
  display: grid;
  width: min(100%, 480px);
  min-height: 38px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 9px;
  justify-self: center;
  border: 1px solid
    var(--aimers-border);
  border-radius: 10px;
  padding: 0 11px;
  color: var(--aimers-text-muted);
  background:
    rgba(11, 15, 32, 0.77);
  text-align: left;
}

.staff-search kbd {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 6px;
  padding: 3px 6px;
  color: var(--aimers-text-muted);
  background:
    rgba(255, 255, 255, 0.03);
  font-family: inherit;
  font-size: 7px;
}

.staff-topbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
}

.staff-security-status {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 6px;
  border: 1px solid
    rgba(34, 197, 94, 0.14);
  border-radius: 9px;
  padding: 0 9px;
  color: #73dca5;
  background:
    rgba(34, 197, 94, 0.035);
  font-size: 7px;
}

.staff-topbar-icon {
  position: relative;
  display: grid;
  width: 37px;
  height: 37px;
  place-items: center;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 10px;
  color: var(--aimers-text-secondary);
  background:
    rgba(255, 255, 255, 0.025);
}

.staff-topbar-icon > span {
  position: absolute;
  top: -4px;
  right: -4px;
  display: grid;
  width: 15px;
  height: 15px;
  place-items: center;
  border: 2px solid #030510;
  border-radius: 50%;
  background: #ef476f;
  font-size: 6px;
}

.staff-account {
  display: grid;
  min-height: 40px;
  grid-template-columns: 31px 1fr auto;
  align-items: center;
  gap: 8px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 10px;
  padding: 4px 8px;
  color: white;
  background:
    rgba(255, 255, 255, 0.025);
  text-align: left;
}

.staff-account > span {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border-radius: 8px;
  background:
    linear-gradient(
      135deg,
      #52308b,
      #20446e
    );
  font-size: 8px;
  font-weight: 800;
}

.staff-account strong {
  display: block;
  font-size: 8px;
}

.staff-account small {
  display: block;
  margin-top: 2px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.staff-page-content {
  min-height:
    calc(100vh - 111px);
  padding: 14px;
}

.staff-system-footer {
  display: flex;
  min-height: 39px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid
    var(--aimers-border-soft);
  padding: 0 17px;
  color: var(--aimers-text-muted);
  background:
    rgba(3, 6, 16, 0.8);
  font-size: 7px;
}

.staff-system-footer span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.staff-system-footer
  span:first-child {
  color: #54d89b;
}

.staff-module-page {
  display: grid;
  gap: 12px;
}

.staff-module-hero {
  display: flex;
  min-height: 190px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  overflow: hidden;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 20px;
  padding: 25px;
  background:
    radial-gradient(
      circle at 85% 20%,
      rgba(139, 64, 224, 0.2),
      transparent 35%
    ),
    var(--aimers-surface-1);
}

.staff-module-hero
  > div
  > span {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #ac89da;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.staff-module-hero h1 {
  margin: 12px 0 8px;
  font-size:
    clamp(35px, 5vw, 62px);
  letter-spacing: -0.06em;
}

.staff-module-hero p {
  max-width: 720px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.6;
}

.staff-module-hero button,
.staff-module-content button {
  display: flex;
  min-height: 39px;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 10px;
  padding: 0 14px;
  color: white;
  background: var(--aimers-gradient-primary);
  font-size: 9px;
  font-weight: 700;
}

.staff-module-metrics {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.staff-module-metrics article {
  display: flex;
  min-height: 82px;
  align-items: center;
  gap: 11px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 14px;
  padding: 13px;
  background: var(--aimers-surface-1);
}

.staff-module-metrics
  article
  > span {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  color: #c087ff;
  background:
    rgba(139, 92, 246, 0.1);
}

.staff-module-metrics small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 7px;
  letter-spacing: 0.11em;
}

.staff-module-metrics strong {
  display: block;
  margin-top: 4px;
  font-size: 11px;
}

.staff-module-content {
  display: grid;
  grid-template-columns:
    minmax(0, 1.5fr)
    minmax(280px, 0.5fr);
  gap: 12px;
}

.staff-module-content
  > article,
.staff-module-content
  > aside {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 18px;
  background: var(--aimers-surface-1);
}

.staff-module-content
  > article {
  min-height: 430px;
  padding: 20px;
}

.staff-module-content
  > article
  > header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.staff-module-content
  > article
  > header span,
.staff-module-content
  > aside
  > span {
  color: #a486d3;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.staff-module-content h2 {
  margin: 7px 0 0;
  font-size: 19px;
}

.staff-module-content
  > article
  > header button {
  background:
    rgba(139, 92, 246, 0.1);
}

.staff-module-placeholder {
  display: grid;
  min-height: 335px;
  place-content: center;
  justify-items: center;
  text-align: center;
}

.staff-module-placeholder > span {
  display: grid;
  width: 83px;
  height: 83px;
  place-items: center;
  border: 1px solid
    rgba(160, 99, 255, 0.27);
  border-radius: 26px;
  color: #bd80ff;
  background:
    rgba(139, 92, 246, 0.1);
  box-shadow:
    0 0 37px rgba(139, 92, 246, 0.15);
}

.staff-module-placeholder h3 {
  margin: 18px 0 8px;
}

.staff-module-placeholder p {
  max-width: 500px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.staff-module-content > aside {
  padding: 22px;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(221, 62, 203, 0.13),
      transparent 33%
    ),
    var(--aimers-surface-1);
}

.staff-module-content
  > aside p {
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.staff-module-content
  > aside button {
  margin-top: 17px;
}

.staff-login-page {
  display: grid;
  min-height: 100vh;
  grid-template-columns:
    minmax(430px, 0.95fr)
    minmax(460px, 1.05fr);
}

.staff-login-brand-panel {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: space-between;
  padding:
    35px clamp(35px, 6vw, 90px)
    80px;
  background:
    radial-gradient(
      circle at 20% 75%,
      rgba(42, 104, 220, 0.18),
      transparent 31%
    ),
    radial-gradient(
      circle at 80% 25%,
      rgba(164, 58, 224, 0.2),
      transparent 35%
    ),
    linear-gradient(
      145deg,
      #060a1a,
      #08081d
    );
}

.staff-login-brand-panel
  > a {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.staff-login-brand-panel
  > a
  > span {
  display: grid;
  width: 41px;
  height: 41px;
  place-items: center;
  border: 1px solid
    rgba(149, 94, 255, 0.34);
  border-radius: 13px;
  color: #cf91ff;
  background:
    rgba(151, 66, 239, 0.15);
}

.staff-login-brand-panel
  > a strong {
  display: block;
  letter-spacing: 0.14em;
}

.staff-login-brand-panel
  > a strong i {
  color: #a86dff;
  font-style: normal;
}

.staff-login-brand-panel
  > a small {
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.staff-login-brand-panel
  > div
  > span {
  color: #ae8ae1;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.staff-login-brand-panel h1 {
  max-width: 700px;
  margin: 18px 0;
  font-size:
    clamp(42px, 5.5vw, 74px);
  letter-spacing: -0.065em;
  line-height: 1;
}

.staff-login-brand-panel
  > div
  > p {
  max-width: 610px;
  color: var(--aimers-text-secondary);
  line-height: 1.75;
}

.staff-login-brand-panel
  > div
  > section {
  display: flex;
  max-width: 470px;
  align-items: center;
  gap: 11px;
  border: 1px solid
    rgba(34, 197, 94, 0.14);
  border-radius: 13px;
  margin-top: 28px;
  padding: 14px;
  color: #61dfa0;
  background:
    rgba(34, 197, 94, 0.04);
}

.staff-login-brand-panel
  section strong {
  display: block;
  color: white;
  font-size: 10px;
}

.staff-login-brand-panel
  section small {
  display: block;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.staff-login-form-panel {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 30px;
}

.staff-login-form-panel form {
  display: grid;
  width: min(430px, 100%);
}

.staff-login-form-panel
  form
  > span {
  color: #aa85d7;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.staff-login-form-panel h2 {
  margin: 14px 0 9px;
  font-size: 35px;
  letter-spacing: -0.05em;
}

.staff-login-form-panel
  form
  > p {
  margin: 0 0 28px;
  color: var(--aimers-text-muted);
}

.staff-login-form-panel label {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.staff-login-form-panel
  label
  > span {
  color: var(--aimers-text-secondary);
  font-size: 10px;
}

.staff-login-form-panel
  label
  > div {
  display: grid;
  min-height: 48px;
  grid-template-columns: 24px 1fr;
  align-items: center;
  border: 1px solid
    var(--aimers-border);
  border-radius: 12px;
  padding: 0 13px;
  color: var(--aimers-text-muted);
  background:
    var(--aimers-surface-1);
}

.staff-login-form-panel input {
  min-width: 0;
  border: 0;
  outline: 0;
  color: white;
  background: transparent;
}

.staff-login-form-panel
  form
  > button {
  display: flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 0;
  border-radius: 11px;
  margin-top: 5px;
  color: white;
  background:
    var(--aimers-gradient-primary);
  font-size: 10px;
  font-weight: 700;
}

.staff-login-form-panel
  form
  > small {
  margin-top: 18px;
  color: var(--aimers-text-muted);
  font-size: 8px;
  text-align: center;
}

@media (max-width: 1180px) {
  .staff-app-shell {
    grid-template-columns: 1fr;
  }

  .staff-sidebar {
    position: fixed;
    left: 0;
    width:
      min(
        238px,
        calc(100vw - 44px)
      );
    transform: translateX(-105%);
    transition:
      transform
      var(--aimers-transition);
  }

  .staff-sidebar.open {
    transform: translateX(0);
  }

  .staff-sidebar-backdrop {
    position: fixed;
    z-index: 65;
    inset: 0;
    display: block;
    border: 0;
    opacity: 0;
    pointer-events: none;
    background:
      rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
  }

  .staff-sidebar-backdrop.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .staff-brand > button,
  .staff-topbar-title > button {
    display: grid;
  }
}

@media (max-width: 900px) {
  .staff-topbar {
    grid-template-columns: 1fr auto;
  }

  .staff-search,
  .staff-security-status {
    display: none;
  }

  .staff-account div,
  .staff-account > svg {
    display: none;
  }

  .staff-account {
    grid-template-columns: 31px;
  }

  .staff-module-content {
    grid-template-columns: 1fr;
  }

  .staff-login-page {
    grid-template-columns: 1fr;
  }

  .staff-login-brand-panel {
    min-height: 540px;
  }

  .staff-login-form-panel {
    min-height: 680px;
  }
}

@media (max-width: 680px) {
  .staff-topbar {
    padding: 8px 10px;
  }

  .staff-topbar-title p {
    display: none;
  }

  .staff-topbar-title h1 {
    font-size: 13px;
  }

  .staff-topbar-icon:first-of-type {
    display: none;
  }

  .staff-page-content {
    padding: 9px;
  }

  .staff-system-footer
    span:nth-child(2) {
    display: none;
  }

  .staff-module-hero {
    min-height: 250px;
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .staff-module-metrics {
    grid-template-columns: 1fr 1fr;
  }

  .staff-login-brand-panel {
    min-height: 580px;
    padding: 25px 20px 55px;
  }

  .staff-login-form-panel {
    padding: 24px 18px;
  }
}
EOF

# ============================================================
# DASHBOARD STYLES
# ============================================================

cat > apps/staff/src/pages/dashboard/staff-dashboard.css <<'EOF'
.staff-dashboard-page {
  display: grid;
  gap: 11px;
}

.staff-dashboard-heading {
  display: flex;
  min-height: 100px;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 16px;
  padding: 17px 19px;
  background:
    radial-gradient(
      circle at 88% 25%,
      rgba(144, 56, 211, 0.13),
      transparent 32%
    ),
    var(--aimers-surface-1);
}

.staff-dashboard-heading
  > div:first-child
  > span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #a98bd3;
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.staff-dashboard-heading h1 {
  margin: 7px 0 4px;
  font-size: 23px;
  letter-spacing: -0.03em;
}

.staff-dashboard-heading p {
  margin: 0;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.staff-dashboard-heading
  > div:last-child {
  display: flex;
  gap: 8px;
}

.staff-dashboard-heading a {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 7px;
  border: 1px solid
    var(--aimers-border);
  border-radius: 9px;
  padding: 0 12px;
  color: var(--aimers-text-secondary);
  background:
    rgba(255, 255, 255, 0.025);
  font-size: 8px;
  text-decoration: none;
}

.staff-dashboard-heading
  a:last-child {
  color: white;
  background:
    var(--aimers-gradient-primary);
}

.staff-metric-grid {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(0, 1fr));
  gap: 9px;
}

.staff-metric-card,
.staff-panel,
.staff-audit-strip {
  border: 1px solid
    var(--aimers-border-soft);
  background:
    linear-gradient(
      180deg,
      rgba(11, 16, 35, 0.94),
      rgba(6, 10, 24, 0.94)
    );
  box-shadow:
    var(--aimers-shadow-panel);
}

.staff-metric-card {
  min-height: 138px;
  border-radius: 14px;
  padding: 13px;
}

.staff-metric-card header {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 7px;
}

.staff-metric-card
  header
  > span {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border-radius: 8px;
  color: currentColor;
  background:
    color-mix(
      in srgb,
      currentColor 12%,
      transparent
    );
}

.staff-metric-card
  header small {
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.1em;
}

.staff-metric-card
  header button {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border: 0;
  border-radius: 7px;
  color: currentColor;
  background:
    rgba(255, 255, 255, 0.025);
}

.staff-metric-card > strong {
  display: block;
  margin-top: 15px;
  color: white;
  font-size: 24px;
  font-weight: 500;
}

.staff-metric-card > p {
  margin: 3px 0 10px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.staff-metric-card footer {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #52da99;
  font-size: 7px;
}

.staff-tone-violet {
  color: #a47bff;
}

.staff-tone-danger {
  color: #ff6680;
}

.staff-tone-blue {
  color: #538bff;
}

.staff-tone-green {
  color: #4cdb96;
}

.staff-tone-cyan {
  color: #3cd8e9;
}

.staff-primary-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.45fr)
    minmax(340px, 0.55fr);
  gap: 10px;
}

.staff-secondary-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.staff-lower-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.2fr)
    minmax(350px, 0.8fr);
  gap: 10px;
}

.staff-panel {
  min-width: 0;
  border-radius: 15px;
  padding: 14px;
}

.staff-panel-heading {
  display: flex;
  min-height: 35px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
}

.staff-panel-heading h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
}

.staff-panel-heading p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.staff-panel-heading a {
  color: #a895d3;
  font-size: 7px;
  text-decoration: none;
}

.staff-panel-heading button {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 7px;
  padding: 4px 7px;
  color: var(--aimers-text-secondary);
  background:
    rgba(255, 255, 255, 0.025);
  font-size: 7px;
}

.student-table {
  margin-top: 10px;
}

.student-table > header,
.student-table > section {
  display: grid;
  min-height: 46px;
  grid-template-columns:
    1.35fr 0.8fr 0.8fr 0.55fr 0.55fr 25px;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
  font-size: 7px;
}

.student-table > header {
  min-height: 30px;
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.07em;
}

.student-table
  > section
  > span:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
}

.student-table
  > section
  > span:first-child i {
  display: grid;
  width: 29px;
  height: 29px;
  place-items: center;
  border-radius: 8px;
  color: #e8ddff;
  background:
    linear-gradient(
      135deg,
      #533183,
      #284161
    );
  font-size: 7px;
  font-style: normal;
}

.student-table
  > section
  > span {
  color: var(--aimers-text-secondary);
}

.student-table
  > section
  > span:nth-child(3) {
  display: flex;
  align-items: center;
  gap: 5px;
}

.student-table
  > section
  > strong {
  font-size: 8px;
}

.student-table b {
  border-radius: 999px;
  padding: 3px 6px;
  font-size: 6px;
  font-weight: 500;
}

.student-table b.high {
  color: #ff7186;
  background:
    rgba(239, 71, 111, 0.08);
}

.student-table b.medium {
  color: #f6b04b;
  background:
    rgba(245, 158, 11, 0.08);
}

.student-table b.low {
  color: #55d99a;
  background:
    rgba(34, 197, 94, 0.08);
}

.student-table
  > section
  > a {
  display: grid;
  width: 23px;
  height: 23px;
  place-items: center;
  border-radius: 7px;
  color: #a98ad7;
  background:
    rgba(139, 92, 246, 0.06);
}

.mentor-alert-list {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.mentor-alert-list section {
  display: grid;
  min-height: 67px;
  grid-template-columns: 29px 1fr;
  gap: 9px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 9px;
  padding: 9px;
  background:
    rgba(255, 255, 255, 0.016);
}

.mentor-alert-list
  section
  > span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
}

.mentor-alert-list
  .danger {
  color: #ff6e84;
  background:
    rgba(239, 71, 111, 0.09);
}

.mentor-alert-list
  .warning {
  color: #f9b44e;
  background:
    rgba(245, 158, 11, 0.09);
}

.mentor-alert-list
  .success {
  color: #59dc9e;
  background:
    rgba(34, 197, 94, 0.09);
}

.mentor-alert-list
  .violet {
  color: #bd82ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.mentor-alert-list strong {
  display: block;
  font-size: 8px;
}

.mentor-alert-list p {
  margin: 4px 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.45;
}

.mentor-alert-list small {
  color: #59627f;
  font-size: 6px;
}

.staff-secondary-grid
  > .staff-panel {
  min-height: 314px;
}

.mentor-chart {
  display: grid;
  height: 220px;
  grid-template-columns: 28px 1fr;
  gap: 5px;
  margin-top: 12px;
}

.mentor-chart-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 20px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.mentor-chart-plot {
  border-left: 1px solid
    rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.04);
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 52px,
      rgba(255, 255, 255, 0.035)
        53px
    );
}

.mentor-chart-plot svg {
  width: 100%;
  height: 190px;
}

.mentor-chart-plot > div {
  display: flex;
  justify-content: space-between;
  padding-top: 5px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.mentor-chart-legend {
  display: flex;
  gap: 14px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.mentor-chart-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.mentor-chart-legend i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8b5cf6;
}

.mentor-chart-legend
  span:last-child i {
  background: #22d3ee;
}

.attention-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.attention-grid a {
  display: grid;
  min-height: 100px;
  grid-template-columns: 37px 1fr auto;
  align-items: center;
  gap: 9px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 11px;
  padding: 10px;
  background:
    rgba(255, 255, 255, 0.017);
  text-decoration: none;
}

.attention-grid a > span {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  color: #b985ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.attention-grid strong {
  display: block;
  font-size: 17px;
}

.attention-grid small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.attention-grid a > svg {
  color: #727b98;
}

.mentor-effectiveness {
  display: grid;
  grid-template-columns: 112px 1fr;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
}

.effectiveness-ring {
  display: grid;
  width: 105px;
  height: 105px;
  place-items: center;
  border-radius: 50%;
  background:
    conic-gradient(
      #7c3aed 0deg,
      #22d3ee 317deg,
      rgba(69, 78, 112, 0.2)
        317deg
    );
}

.effectiveness-ring::before {
  position: absolute;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: #0a0f21;
  content: "";
}

.effectiveness-ring {
  position: relative;
}

.effectiveness-ring > span {
  position: relative;
  z-index: 1;
  text-align: center;
}

.effectiveness-ring strong {
  display: block;
  font-size: 16px;
}

.effectiveness-ring small {
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.mentor-effectiveness
  > div:last-child {
  display: grid;
  gap: 10px;
}

.mentor-effectiveness section {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
  padding-bottom: 7px;
}

.mentor-effectiveness
  section span {
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.mentor-effectiveness
  section strong {
  font-size: 8px;
}

.staff-full-link {
  display: flex;
  min-height: 29px;
  align-items: center;
  justify-content: center;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 8px;
  margin-top: 18px;
  color: #a795d0;
  background:
    rgba(139, 92, 246, 0.04);
  font-size: 7px;
  text-decoration: none;
}

.staff-lower-grid
  > .staff-panel {
  min-height: 282px;
}

.active-intervention-list {
  display: grid;
  gap: 7px;
  margin-top: 12px;
}

.active-intervention-list
  section {
  display: grid;
  min-height: 61px;
  grid-template-columns:
    31px 1fr minmax(170px, 0.8fr);
  align-items: center;
  gap: 9px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 9px;
  padding: 9px;
  background:
    rgba(255, 255, 255, 0.016);
}

.active-intervention-list
  section
  > span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
  color: #bd82ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.active-intervention-list
  strong {
  display: block;
  font-size: 8px;
}

.active-intervention-list
  small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.intervention-progress header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.intervention-progress
  header strong {
  color: #54d99a;
  font-size: 6px;
}

.intervention-progress
  > div {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background:
    rgba(104, 114, 153, 0.13);
}

.intervention-progress
  > div
  > i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background:
    linear-gradient(
      90deg,
      #6d4ce7,
      #22d3ee
    );
}

.staff-ai-panel {
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(214, 56, 209, 0.15),
      transparent 33%
    ),
    linear-gradient(
      180deg,
      rgba(11, 16, 35, 0.94),
      rgba(6, 10, 24, 0.94)
    );
}

.staff-ai-panel
  .staff-panel-heading
  > svg {
  color: #c683ff;
}

.mentor-ai-message {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 9px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 10px;
  margin-top: 10px;
  padding: 10px;
  background:
    rgba(255, 255, 255, 0.017);
}

.mentor-ai-message > span {
  display: grid;
  width: 33px;
  height: 33px;
  place-items: center;
  border-radius: 9px;
  color: #bc82ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.mentor-ai-message strong {
  display: block;
  font-size: 8px;
}

.mentor-ai-message p {
  margin: 5px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.5;
}

.staff-ai-panel > button {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  margin-top: 12px;
  padding: 0 12px;
  color: white;
  background:
    var(--aimers-gradient-primary);
  font-size: 8px;
}

.staff-audit-strip {
  display: flex;
  min-height: 63px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-color:
    rgba(34, 197, 94, 0.13);
  border-radius: 14px;
  padding: 11px 14px;
  background:
    linear-gradient(
      90deg,
      rgba(20, 104, 72, 0.1),
      rgba(13, 16, 33, 0.94)
    );
}

.staff-audit-strip > div {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #57dc9c;
}

.staff-audit-strip strong {
  display: block;
  color: white;
  font-size: 9px;
}

.staff-audit-strip small {
  display: block;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.staff-audit-strip > a {
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 6px;
  border: 1px solid
    rgba(34, 197, 94, 0.15);
  border-radius: 8px;
  padding: 0 10px;
  color: #6fe0a7;
  background:
    rgba(34, 197, 94, 0.04);
  font-size: 7px;
  text-decoration: none;
}

@media (max-width: 1450px) {
  .staff-metric-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .staff-secondary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .staff-secondary-grid
    > .staff-panel:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1080px) {
  .staff-primary-grid,
  .staff-lower-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .staff-dashboard-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .staff-dashboard-heading
    > div:last-child {
    width: 100%;
  }

  .staff-dashboard-heading a {
    flex: 1;
    justify-content: center;
  }

  .staff-metric-grid,
  .staff-secondary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .staff-secondary-grid
    > .staff-panel:last-child {
    grid-column: auto;
  }

  .student-table {
    overflow-x: auto;
  }

  .student-table > header,
  .student-table > section {
    min-width: 650px;
  }
}

@media (max-width: 520px) {
  .staff-metric-grid,
  .staff-secondary-grid {
    grid-template-columns: 1fr;
  }

  .attention-grid {
    grid-template-columns: 1fr;
  }

  .active-intervention-list
    section {
    grid-template-columns:
      31px 1fr;
  }

  .intervention-progress {
    grid-column: 1 / -1;
  }

  .staff-audit-strip {
    align-items: flex-start;
    flex-direction: column;
  }

  .staff-audit-strip > a {
    width: 100%;
    justify-content: center;
  }
}
EOF

echo "AIMERS OS staff portal source created."
