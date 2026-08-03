#!/usr/bin/env bash

set -euo pipefail

echo "Creating AIMERS OS parent and institution portals..."

# ============================================================
# PARENT PORTAL DIRECTORIES
# ============================================================

mkdir -p \
  apps/parent/src/app/router \
  apps/parent/src/app/shell \
  apps/parent/src/components/navigation \
  apps/parent/src/data \
  apps/parent/src/pages/auth \
  apps/parent/src/pages/dashboard \
  apps/parent/src/pages/shared \
  apps/parent/src/styles

# ============================================================
# PARENT PACKAGE
# ============================================================

cat > apps/parent/package.json <<'EOF'
{
  "name": "@aimers/parent",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "AIMERS OS parent progress portal",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5177",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  }
}
EOF

cat > apps/parent/tsconfig.json <<'EOF'
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

cat > apps/parent/vite.config.ts <<'EOF'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177
  }
});
EOF

cat > apps/parent/index.html <<'EOF'
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
      AIMERS OS — Parent Portal
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
# PARENT NAVIGATION DATA
# ============================================================

cat > apps/parent/src/data/navigation.ts <<'EOF'
import type { LucideIcon } from "lucide-react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Home,
  Settings,
  ShieldCheck,
  Target,
} from "lucide-react";

export interface ParentNavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const parentNavigation: ParentNavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Home
  },
  {
    label: "Child Progress",
    path: "/child-progress",
    icon: BarChart3
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: CalendarDays
  },
  {
    label: "Study Time",
    path: "/study-time",
    icon: Clock3
  },
  {
    label: "Test Results",
    path: "/test-results",
    icon: Target
  },
  {
    label: "Weak Topics",
    path: "/weak-topics",
    icon: Activity
  },
  {
    label: "Alerts",
    path: "/alerts",
    icon: AlertTriangle
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FileText
  },
  {
    label: "Subscription",
    path: "/subscriptions",
    icon: CreditCard
  },
  {
    label: "Privacy",
    path: "/privacy",
    icon: ShieldCheck
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings
  }
];
EOF

# ============================================================
# PARENT SIDEBAR
# ============================================================

cat > apps/parent/src/components/navigation/ParentSidebar.tsx <<'EOF'
import {
  Brain,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { parentNavigation } from "../../data/navigation";

interface ParentSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ParentSidebar({
  open,
  onClose,
}: ParentSidebarProps) {
  return (
    <>
      <button
        className={
          open
            ? "parent-sidebar-backdrop visible"
            : "parent-sidebar-backdrop"
        }
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          open
            ? "parent-sidebar open"
            : "parent-sidebar"
        }
      >
        <header className="parent-brand">
          <span>
            <Brain size={25} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>Parent Portal</small>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <section className="parent-child-card">
          <div className="parent-child-avatar">
            RN
          </div>

          <div>
            <small>VIEWING PROGRESS FOR</small>
            <strong>Ram N.</strong>
            <span>NEET 2027 Aspirant</span>
          </div>
        </section>

        <nav className="parent-navigation">
          {parentNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "parent-nav-link active"
                    : "parent-nav-link"
                }
                onClick={onClose}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                <i />
              </NavLink>
            );
          })}
        </nav>

        <section className="parent-privacy-card">
          <ShieldCheck size={17} />

          <div>
            <strong>Respectful reporting</strong>

            <p>
              Parents receive progress summaries,
              not private messages, raw browsing
              history or sensitive student data.
            </p>
          </div>
        </section>

        <footer className="parent-profile">
          <div className="parent-profile-avatar">
            AN
          </div>

          <div>
            <strong>Account Parent</strong>
            <small>Verified guardian</small>
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
# PARENT TOPBAR
# ============================================================

cat > apps/parent/src/components/navigation/ParentTopbar.tsx <<'EOF'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  ShieldCheck,
} from "lucide-react";

interface ParentTopbarProps {
  onOpenSidebar: () => void;
}

export function ParentTopbar({
  onOpenSidebar,
}: ParentTopbarProps) {
  return (
    <header className="parent-topbar">
      <div className="parent-topbar-title">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1>Parent Dashboard</h1>

          <p>
            Support progress with clear,
            respectful academic insights.
          </p>
        </div>
      </div>

      <div className="parent-topbar-status">
        <ShieldCheck size={15} />

        <span>
          Privacy controls active
        </span>
      </div>

      <div className="parent-topbar-actions">
        <button
          className="parent-topbar-icon"
          type="button"
          aria-label="Calendar"
        >
          <CalendarDays size={17} />
        </button>

        <button
          className="parent-topbar-icon"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span>3</span>
        </button>

        <button
          className="parent-account"
          type="button"
        >
          <span>AN</span>

          <div>
            <strong>Parent Account</strong>
            <small>Verified guardian</small>
          </div>

          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
EOF

# ============================================================
# PARENT SHELL
# ============================================================

cat > apps/parent/src/app/shell/ParentShell.tsx <<'EOF'
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

import { ParentSidebar } from "../../components/navigation/ParentSidebar";
import { ParentTopbar } from "../../components/navigation/ParentTopbar";

export function ParentShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="parent-app-shell">
      <ParentSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="parent-main-column">
        <ParentTopbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="parent-page-content">
          <Outlet />
        </main>

        <footer className="parent-system-footer">
          <span>
            <CircleCheck size={13} />
            Parent reporting operational
          </span>

          <span>
            <ShieldCheck size={13} />
            Privacy controls active
          </span>

          <strong>
            AIMERS Parent v2.0.0
          </strong>
        </footer>
      </div>
    </div>
  );
}
EOF

# ============================================================
# PARENT DASHBOARD
# ============================================================

cat > apps/parent/src/pages/dashboard/ParentDashboardPage.tsx <<'EOF'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import "./parent-dashboard.css";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: string;
}

const subjects = [
  {
    name: "Physics",
    value: 82,
    status: "Strong"
  },
  {
    name: "Chemistry",
    value: 71,
    status: "Improving"
  },
  {
    name: "Biology",
    value: 79,
    status: "Good"
  }
];

const schedule = [
  {
    title: "Physics mock test",
    date: "5 August",
    time: "10:00 AM"
  },
  {
    title: "Mentor progress review",
    date: "7 August",
    time: "6:30 PM"
  },
  {
    title: "Chemistry revision target",
    date: "8 August",
    time: "Daily plan"
  }
];

function ParentMetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: MetricCardProps) {
  return (
    <article
      className={`parent-metric-card parent-tone-${tone}`}
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

function ParentPanel({
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
      className={`parent-panel ${className}`}
    >
      <header className="parent-panel-heading">
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

export function ParentDashboardPage() {
  return (
    <div className="parent-dashboard-page">
      <section className="parent-dashboard-heading">
        <div>
          <span>
            <Sparkles size={14} />
            WEEKLY PARENT SUMMARY
          </span>

          <h1>
            Ram is making steady progress.
          </h1>

          <p>
            Study consistency improved this
            week, while Chemistry still needs
            additional revision.
          </p>
        </div>

        <div>
          <Link to="/reports">
            <FileText size={14} />
            Download report
          </Link>

          <Link to="/alerts">
            <MessageSquareText size={14} />
            View updates
          </Link>
        </div>
      </section>

      <section className="parent-metric-grid">
        <ParentMetricCard
          label="STUDY TIME TODAY"
          value="7h 32m"
          detail="Weekly average: 6h 48m"
          icon={<Clock3 size={17} />}
          tone="blue"
        />

        <ParentMetricCard
          label="AVERAGE ACCURACY"
          value="78%"
          detail="Up 6% this month"
          icon={<Target size={17} />}
          tone="green"
        />

        <ParentMetricCard
          label="STUDY STREAK"
          value="27 days"
          detail="Personal best"
          icon={<Flame size={17} />}
          tone="orange"
        />

        <ParentMetricCard
          label="TASK COMPLETION"
          value="84%"
          detail="21 of 25 tasks completed"
          icon={
            <CheckCircle2 size={17} />
          }
          tone="violet"
        />

        <ParentMetricCard
          label="ATTENTION ITEMS"
          value="3"
          detail="One needs parent awareness"
          icon={
            <AlertTriangle size={17} />
          }
          tone="danger"
        />
      </section>

      <section className="parent-primary-grid">
        <ParentPanel
          title="Weekly Learning Progress"
          description="Study time and academic accuracy"
          action={
            <button type="button">
              This week
            </button>
          }
        >
          <div className="parent-chart-summary">
            <section>
              <small>Total study time</small>
              <strong>47h 36m</strong>
              <span>+5h 12m</span>
            </section>

            <section>
              <small>Questions solved</small>
              <strong>846</strong>
              <span>+128</span>
            </section>

            <section>
              <small>Average accuracy</small>
              <strong>78%</strong>
              <span>+6%</span>
            </section>
          </div>

          <div className="parent-progress-chart">
            <div className="parent-chart-axis">
              <span>10h</span>
              <span>8h</span>
              <span>6h</span>
              <span>4h</span>
              <span>2h</span>
            </div>

            <div className="parent-chart-plot">
              <svg
                viewBox="0 0 700 230"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="parentStudyArea"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity="0.5"
                    />

                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 185 L115 155 L230 165 L345 110 L460 128 L575 75 L700 58 L700 230 L0 230 Z"
                  fill="url(#parentStudyArea)"
                />

                <polyline
                  points="0,185 115,155 230,165 345,110 460,128 575,75 700,58"
                  fill="none"
                  stroke="#9875ff"
                  strokeWidth="4"
                />

                <polyline
                  points="0,205 115,188 230,194 345,161 460,170 575,138 700,118"
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

          <footer className="parent-chart-legend">
            <span>
              <i />
              Study time
            </span>

            <span>
              <i />
              Accuracy trend
            </span>
          </footer>
        </ParentPanel>

        <ParentPanel
          title="Subject Progress"
          description="Current subject mastery"
          action={
            <Link to="/child-progress">
              Full progress
            </Link>
          }
        >
          <div className="parent-subject-score">
            <div className="parent-overall-ring">
              <span>
                <strong>77%</strong>
                <small>Overall</small>
              </span>
            </div>

            <div>
              <strong>
                Good overall momentum
              </strong>

              <p>
                Chemistry needs more regular
                revision to match Physics and
                Biology performance.
              </p>
            </div>
          </div>

          <div className="parent-subject-list">
            {subjects.map((subject) => (
              <section key={subject.name}>
                <header>
                  <span>{subject.name}</span>

                  <strong>
                    {subject.value}%
                  </strong>
                </header>

                <div>
                  <i
                    style={{
                      width: `${subject.value}%`,
                    }}
                  />
                </div>

                <small>{subject.status}</small>
              </section>
            ))}
          </div>
        </ParentPanel>
      </section>

      <section className="parent-secondary-grid">
        <ParentPanel
          title="Recent Academic Updates"
          description="Important progress events"
        >
          <div className="parent-update-list">
            <section>
              <span className="success">
                <CheckCircle2 size={15} />
              </span>

              <div>
                <strong>
                  Biology accuracy improved
                </strong>

                <p>
                  Human Physiology accuracy
                  increased from 69% to 81%.
                </p>

                <small>Today</small>
              </div>
            </section>

            <section>
              <span className="warning">
                <AlertTriangle size={15} />
              </span>

              <div>
                <strong>
                  Chemistry revision pending
                </strong>

                <p>
                  Two Organic Chemistry
                  revision tasks remain.
                </p>

                <small>Yesterday</small>
              </div>
            </section>

            <section>
              <span className="violet">
                <Brain size={15} />
              </span>

              <div>
                <strong>
                  New AI study plan created
                </strong>

                <p>
                  AIMERS adjusted next week's
                  study order.
                </p>

                <small>2 days ago</small>
              </div>
            </section>
          </div>
        </ParentPanel>

        <ParentPanel
          title="Upcoming Schedule"
          description="Important learning events"
          action={
            <Link to="/attendance">
              View calendar
            </Link>
          }
        >
          <div className="parent-schedule-list">
            {schedule.map((item, index) => (
              <section key={item.title}>
                <span>
                  <CalendarDays size={16} />
                </span>

                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {item.date} · {item.time}
                  </small>
                </div>

                <i>{index + 1}</i>
              </section>
            ))}
          </div>
        </ParentPanel>

        <ParentPanel
          title="Mentor Summary"
          description="Academic mentor guidance"
          className="parent-mentor-panel"
          action={<Brain size={18} />}
        >
          <div className="parent-mentor-message">
            <span>
              <Brain size={18} />
            </span>

            <div>
              <strong>
                Weekly mentor note
              </strong>

              <p>
                Ram is consistent and responds
                well to morning study sessions.
                Encourage regular sleep and
                avoid increasing daily pressure.
              </p>
            </div>
          </div>

          <div className="parent-support-actions">
            <Link to="/reports">
              Read full report
              <ArrowRight size={13} />
            </Link>

            <Link to="/alerts">
              View parent alerts
              <ArrowRight size={13} />
            </Link>
          </div>
        </ParentPanel>
      </section>

      <section className="parent-privacy-strip">
        <div>
          <ShieldCheck size={19} />

          <span>
            <strong>
              Student privacy is protected
            </strong>

            <small>
              This portal shows progress
              summaries and academic support
              information. It does not expose
              private conversations, passwords,
              raw browsing history or sensitive
              personal content.
            </small>
          </span>
        </div>

        <Link to="/privacy">
          Review privacy controls
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
EOF

# ============================================================
# PARENT MODULE PAGE
# ============================================================

cat > apps/parent/src/pages/shared/ParentModulePage.tsx <<'EOF'
import {
  ArrowRight,
  BarChart3,
  Brain,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface ParentModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function ParentModulePage({
  eyebrow,
  title,
  description,
}: ParentModulePageProps) {
  return (
    <div className="parent-module-page">
      <header className="parent-module-hero">
        <div>
          <span>
            <Sparkles size={13} />
            {eyebrow}
          </span>

          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <button type="button">
          Download summary
          <ArrowRight size={14} />
        </button>
      </header>

      <section className="parent-module-metrics">
        <article>
          <span>
            <BarChart3 size={18} />
          </span>

          <div>
            <small>PROGRESS DATA</small>
            <strong>Updated today</strong>
          </div>
        </article>

        <article>
          <span>
            <Brain size={18} />
          </span>

          <div>
            <small>AI SUMMARY</small>
            <strong>Available</strong>
          </div>
        </article>

        <article>
          <span>
            <FileText size={18} />
          </span>

          <div>
            <small>REPORTING</small>
            <strong>Ready</strong>
          </div>
        </article>

        <article>
          <span>
            <ShieldCheck size={18} />
          </span>

          <div>
            <small>PRIVACY</small>
            <strong>Protected view</strong>
          </div>
        </article>
      </section>

      <section className="parent-module-content">
        <article>
          <header>
            <div>
              <span>PARENT WORKSPACE</span>
              <h2>{title} Overview</h2>
            </div>

            <button type="button">
              Configure view
            </button>
          </header>

          <div className="parent-module-placeholder">
            <span>
              <Brain size={43} />
            </span>

            <h3>
              {title} workspace prepared
            </h3>

            <p>
              The responsive parent interface
              and privacy-aware reporting
              structure are ready. Real student
              summaries will be connected
              through the authorised API.
            </p>
          </div>
        </article>

        <aside>
          <span>PARENT GUIDANCE</span>

          <h2>
            Support progress without creating
            unnecessary pressure.
          </h2>

          <p>
            AIMERS will present meaningful
            academic trends and support actions
            while protecting student autonomy
            and private information.
          </p>

          <button type="button">
            Open parent guide
          </button>
        </aside>
      </section>
    </div>
  );
}
EOF

# ============================================================
# PARENT LOGIN
# ============================================================

cat > apps/parent/src/pages/auth/ParentLoginPage.tsx <<'EOF'
import {
  ArrowRight,
  Brain,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export function ParentLoginPage() {
  return (
    <div className="parent-login-page">
      <section className="parent-login-visual">
        <div className="parent-login-brand">
          <span>
            <Brain size={27} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>Parent Portal</small>
          </div>
        </div>

        <div>
          <span>
            RESPECTFUL PARENT SUPPORT
          </span>

          <h1>
            Understand progress without
            increasing pressure.
          </h1>

          <p>
            Follow meaningful learning trends,
            receive academic updates and help
            your child maintain a healthy,
            consistent study system.
          </p>

          <section>
            <ShieldCheck size={18} />

            <div>
              <strong>
                Privacy-aware reporting
              </strong>

              <small>
                Student-sensitive information
                remains protected.
              </small>
            </div>
          </section>
        </div>
      </section>

      <section className="parent-login-form">
        <form
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <span>AIMERS PARENT PORTAL</span>
          <h2>Parent sign in</h2>

          <p>
            Use your verified parent or guardian
            account.
          </p>

          <label>
            <span>Email address</span>

            <div>
              <Mail size={16} />

              <input
                type="email"
                placeholder="parent@example.com"
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
            Access is restricted to verified
            parent and guardian accounts.
          </small>
        </form>
      </section>
    </div>
  );
}
EOF

# ============================================================
# PARENT ROUTER
# ============================================================

cat > apps/parent/src/app/router/ParentRouter.tsx <<'EOF'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ParentShell } from "../shell/ParentShell";

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
      </Routes>
    </BrowserRouter>
  );
}
EOF

cat > apps/parent/src/app/App.tsx <<'EOF'
import { ParentRouter } from "./router/ParentRouter";

export function App() {
  return <ParentRouter />;
}
EOF

cat > apps/parent/src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";

import "./styles/index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error(
    "AIMERS parent root element was not found.",
  );
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

cat > apps/parent/src/vite-env.d.ts <<'EOF'
/// <reference types="vite/client" />
EOF

# ============================================================
# PARENT CSS
# ============================================================

cat > apps/parent/src/styles/index.css <<'EOF'
@import "@aimers/design-tokens/tokens.css";
@import "./parent.css";
@import "../pages/dashboard/parent-dashboard.css";
EOF

cat > apps/parent/src/styles/parent.css <<'EOF'
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

.parent-app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns:
    238px minmax(0, 1fr);
}

.parent-sidebar {
  position: sticky;
  z-index: 70;
  top: 0;
  display: grid;
  height: 100vh;
  grid-template-rows:
    auto auto minmax(0, 1fr) auto auto;
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

.parent-brand {
  display: grid;
  grid-template-columns: 39px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 4px 5px 15px;
}

.parent-brand > span {
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
}

.parent-brand strong {
  display: block;
  font-size: 14px;
  letter-spacing: 0.14em;
}

.parent-brand strong i {
  color: #a56dff;
  font-style: normal;
}

.parent-brand small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.parent-brand > button {
  display: none;
  width: 31px;
  height: 31px;
  place-items: center;
  border: 0;
  border-radius: 9px;
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.035);
}

.parent-child-card {
  display: grid;
  grid-template-columns: 38px 1fr;
  align-items: center;
  gap: 9px;
  border: 1px solid
    rgba(139, 92, 246, 0.18);
  border-radius: 12px;
  margin-bottom: 14px;
  padding: 9px;
  background:
    rgba(118, 69, 201, 0.07);
}

.parent-child-avatar {
  display: grid;
  width: 37px;
  height: 37px;
  place-items: center;
  border-radius: 10px;
  background:
    linear-gradient(
      135deg,
      #543087,
      #214a70
    );
  font-size: 9px;
  font-weight: 800;
}

.parent-child-card small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.09em;
}

.parent-child-card strong {
  display: block;
  margin-top: 3px;
  font-size: 9px;
}

.parent-child-card span {
  display: block;
  margin-top: 2px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.parent-navigation {
  overflow-y: auto;
  padding-right: 3px;
}

.parent-nav-link {
  display: grid;
  min-height: 38px;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 9px;
  margin-bottom: 3px;
  padding: 0 9px;
  color: #aeb5ca;
  font-size: 10px;
  text-decoration: none;
}

.parent-nav-link:hover {
  color: white;
  background:
    rgba(139, 92, 246, 0.055);
}

.parent-nav-link.active {
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

.parent-nav-link > i {
  display: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c07aff;
  box-shadow: 0 0 8px #a855f7;
}

.parent-nav-link.active > i {
  display: block;
}

.parent-privacy-card {
  display: grid;
  grid-template-columns: 25px 1fr;
  gap: 8px;
  border: 1px solid
    rgba(34, 197, 94, 0.13);
  border-radius: 11px;
  margin-top: 10px;
  padding: 10px;
  color: #56db9c;
  background:
    rgba(34, 197, 94, 0.035);
}

.parent-privacy-card strong {
  display: block;
  color: white;
  font-size: 8px;
}

.parent-privacy-card p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 6px;
  line-height: 1.5;
}

.parent-profile {
  display: grid;
  grid-template-columns: 34px 1fr 30px;
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

.parent-profile-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background:
    linear-gradient(
      135deg,
      #4f2a89,
      #1e3f64
    );
  font-size: 9px;
  font-weight: 800;
}

.parent-profile strong {
  display: block;
  font-size: 9px;
}

.parent-profile small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.parent-profile button {
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

.parent-sidebar-backdrop {
  display: none;
}

.parent-main-column {
  min-width: 0;
}

.parent-topbar {
  position: sticky;
  z-index: 50;
  top: 0;
  display: grid;
  min-height: 72px;
  grid-template-columns:
    minmax(250px, 1fr)
    auto
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

.parent-topbar-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.parent-topbar-title > button {
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

.parent-topbar-title h1 {
  margin: 0;
  font-size: 15px;
}

.parent-topbar-title p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.parent-topbar-status {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 7px;
  border: 1px solid
    rgba(34, 197, 94, 0.14);
  border-radius: 9px;
  padding: 0 10px;
  color: #73dca5;
  background:
    rgba(34, 197, 94, 0.035);
  font-size: 7px;
}

.parent-topbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.parent-topbar-icon {
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

.parent-topbar-icon > span {
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

.parent-account {
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

.parent-account > span {
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

.parent-account strong {
  display: block;
  font-size: 8px;
}

.parent-account small {
  display: block;
  margin-top: 2px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.parent-page-content {
  min-height:
    calc(100vh - 111px);
  padding: 14px;
}

.parent-system-footer {
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

.parent-system-footer span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.parent-system-footer
  span:first-child {
  color: #54d89b;
}

.parent-module-page {
  display: grid;
  gap: 12px;
}

.parent-module-hero {
  display: flex;
  min-height: 190px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
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

.parent-module-hero
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

.parent-module-hero h1 {
  margin: 12px 0 8px;
  font-size:
    clamp(35px, 5vw, 62px);
  letter-spacing: -0.06em;
}

.parent-module-hero p {
  max-width: 720px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.6;
}

.parent-module-hero button,
.parent-module-content button {
  display: flex;
  min-height: 39px;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 10px;
  padding: 0 14px;
  color: white;
  background:
    var(--aimers-gradient-primary);
  font-size: 9px;
  font-weight: 700;
}

.parent-module-metrics {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.parent-module-metrics article {
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

.parent-module-metrics
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

.parent-module-metrics small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 7px;
  letter-spacing: 0.11em;
}

.parent-module-metrics strong {
  display: block;
  margin-top: 4px;
  font-size: 11px;
}

.parent-module-content {
  display: grid;
  grid-template-columns:
    minmax(0, 1.5fr)
    minmax(280px, 0.5fr);
  gap: 12px;
}

.parent-module-content > article,
.parent-module-content > aside {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 18px;
  background: var(--aimers-surface-1);
}

.parent-module-content > article {
  min-height: 430px;
  padding: 20px;
}

.parent-module-content
  > article
  > header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.parent-module-content
  > article
  > header span,
.parent-module-content
  > aside
  > span {
  color: #a486d3;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.parent-module-content h2 {
  margin: 7px 0 0;
  font-size: 19px;
}

.parent-module-content
  > article
  > header button {
  background:
    rgba(139, 92, 246, 0.1);
}

.parent-module-placeholder {
  display: grid;
  min-height: 335px;
  place-content: center;
  justify-items: center;
  text-align: center;
}

.parent-module-placeholder > span {
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
}

.parent-module-placeholder h3 {
  margin: 18px 0 8px;
}

.parent-module-placeholder p {
  max-width: 500px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.parent-module-content > aside {
  padding: 22px;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(221, 62, 203, 0.13),
      transparent 33%
    ),
    var(--aimers-surface-1);
}

.parent-module-content
  > aside p {
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.parent-module-content
  > aside button {
  margin-top: 17px;
}

.parent-login-page {
  display: grid;
  min-height: 100vh;
  grid-template-columns:
    minmax(430px, 0.95fr)
    minmax(460px, 1.05fr);
}

.parent-login-visual {
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

.parent-login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.parent-login-brand > span {
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

.parent-login-brand strong {
  display: block;
  letter-spacing: 0.14em;
}

.parent-login-brand strong i {
  color: #a86dff;
  font-style: normal;
}

.parent-login-brand small {
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.parent-login-visual
  > div:last-child
  > span {
  color: #ae8ae1;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.parent-login-visual h1 {
  max-width: 700px;
  margin: 18px 0;
  font-size:
    clamp(42px, 5.5vw, 74px);
  letter-spacing: -0.065em;
  line-height: 1;
}

.parent-login-visual
  > div:last-child
  > p {
  max-width: 610px;
  color: var(--aimers-text-secondary);
  line-height: 1.75;
}

.parent-login-visual
  > div:last-child
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

.parent-login-visual
  section strong {
  display: block;
  color: white;
  font-size: 10px;
}

.parent-login-visual
  section small {
  display: block;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.parent-login-form {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 30px;
}

.parent-login-form form {
  display: grid;
  width: min(430px, 100%);
}

.parent-login-form
  form
  > span {
  color: #aa85d7;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.parent-login-form h2 {
  margin: 14px 0 9px;
  font-size: 35px;
  letter-spacing: -0.05em;
}

.parent-login-form
  form
  > p {
  margin: 0 0 28px;
  color: var(--aimers-text-muted);
}

.parent-login-form label {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.parent-login-form
  label
  > span {
  color: var(--aimers-text-secondary);
  font-size: 10px;
}

.parent-login-form
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

.parent-login-form input {
  min-width: 0;
  border: 0;
  outline: 0;
  color: white;
  background: transparent;
}

.parent-login-form form > button {
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

.parent-login-form form > small {
  margin-top: 18px;
  color: var(--aimers-text-muted);
  font-size: 8px;
  text-align: center;
}

@media (max-width: 1180px) {
  .parent-app-shell {
    grid-template-columns: 1fr;
  }

  .parent-sidebar {
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

  .parent-sidebar.open {
    transform: translateX(0);
  }

  .parent-sidebar-backdrop {
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

  .parent-sidebar-backdrop.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .parent-brand > button,
  .parent-topbar-title > button {
    display: grid;
  }
}

@media (max-width: 900px) {
  .parent-topbar {
    grid-template-columns: 1fr auto;
  }

  .parent-topbar-status {
    display: none;
  }

  .parent-account div,
  .parent-account > svg {
    display: none;
  }

  .parent-account {
    grid-template-columns: 31px;
  }

  .parent-module-content {
    grid-template-columns: 1fr;
  }

  .parent-login-page {
    grid-template-columns: 1fr;
  }

  .parent-login-visual {
    min-height: 540px;
  }

  .parent-login-form {
    min-height: 680px;
  }
}

@media (max-width: 680px) {
  .parent-topbar {
    padding: 8px 10px;
  }

  .parent-topbar-title p {
    display: none;
  }

  .parent-topbar-title h1 {
    font-size: 13px;
  }

  .parent-topbar-icon:first-of-type {
    display: none;
  }

  .parent-page-content {
    padding: 9px;
  }

  .parent-system-footer
    span:nth-child(2) {
    display: none;
  }

  .parent-module-hero {
    min-height: 250px;
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .parent-module-metrics {
    grid-template-columns: 1fr 1fr;
  }

  .parent-login-visual {
    min-height: 580px;
    padding: 25px 20px 55px;
  }

  .parent-login-form {
    padding: 24px 18px;
  }
}
EOF

cat > apps/parent/src/pages/dashboard/parent-dashboard.css <<'EOF'
.parent-dashboard-page {
  display: grid;
  gap: 11px;
}

.parent-dashboard-heading {
  display: flex;
  min-height: 104px;
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

.parent-dashboard-heading
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

.parent-dashboard-heading h1 {
  margin: 7px 0 4px;
  font-size: 23px;
  letter-spacing: -0.03em;
}

.parent-dashboard-heading p {
  margin: 0;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.parent-dashboard-heading
  > div:last-child {
  display: flex;
  gap: 8px;
}

.parent-dashboard-heading a {
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

.parent-dashboard-heading
  a:last-child {
  color: white;
  background:
    var(--aimers-gradient-primary);
}

.parent-metric-grid {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(0, 1fr));
  gap: 9px;
}

.parent-metric-card,
.parent-panel,
.parent-privacy-strip {
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

.parent-metric-card {
  min-height: 138px;
  border-radius: 14px;
  padding: 13px;
}

.parent-metric-card header {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 7px;
}

.parent-metric-card
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

.parent-metric-card
  header small {
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.1em;
}

.parent-metric-card
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

.parent-metric-card > strong {
  display: block;
  margin-top: 15px;
  color: white;
  font-size: 24px;
  font-weight: 500;
}

.parent-metric-card > p {
  margin: 3px 0 10px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.parent-metric-card footer {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #52da99;
  font-size: 7px;
}

.parent-tone-blue {
  color: #538bff;
}

.parent-tone-green {
  color: #4cdb96;
}

.parent-tone-orange {
  color: #f59e0b;
}

.parent-tone-violet {
  color: #a47bff;
}

.parent-tone-danger {
  color: #ff6680;
}

.parent-primary-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.45fr)
    minmax(340px, 0.55fr);
  gap: 10px;
}

.parent-secondary-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.parent-panel {
  min-width: 0;
  border-radius: 15px;
  padding: 14px;
}

.parent-panel-heading {
  display: flex;
  min-height: 35px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
}

.parent-panel-heading h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
}

.parent-panel-heading p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.parent-panel-heading a {
  color: #a895d3;
  font-size: 7px;
  text-decoration: none;
}

.parent-panel-heading button {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 7px;
  padding: 4px 7px;
  color: var(--aimers-text-secondary);
  background:
    rgba(255, 255, 255, 0.025);
  font-size: 7px;
}

.parent-chart-summary {
  display: flex;
  gap: 30px;
  border-bottom: 1px solid
    var(--aimers-border-soft);
  margin-top: 6px;
  padding: 10px 0 13px;
}

.parent-chart-summary section {
  display: grid;
  gap: 4px;
}

.parent-chart-summary small {
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.parent-chart-summary strong {
  font-size: 15px;
  font-weight: 500;
}

.parent-chart-summary span {
  color: #53da99;
  font-size: 7px;
}

.parent-progress-chart {
  display: grid;
  height: 235px;
  grid-template-columns: 29px 1fr;
  gap: 5px;
  margin-top: 12px;
}

.parent-chart-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 20px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.parent-chart-plot {
  border-left: 1px solid
    rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.04);
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 49px,
      rgba(255, 255, 255, 0.035)
        50px
    );
}

.parent-chart-plot svg {
  width: 100%;
  height: 205px;
}

.parent-chart-plot > div {
  display: flex;
  justify-content: space-between;
  padding-top: 5px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.parent-chart-legend {
  display: flex;
  gap: 14px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.parent-chart-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.parent-chart-legend i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8b5cf6;
}

.parent-chart-legend
  span:last-child i {
  background: #22d3ee;
}

.parent-subject-score {
  display: grid;
  grid-template-columns: 112px 1fr;
  align-items: center;
  gap: 15px;
  margin-top: 14px;
}

.parent-overall-ring {
  display: grid;
  width: 104px;
  height: 104px;
  place-items: center;
  border-radius: 50%;
  background:
    conic-gradient(
      #7c3aed 0deg,
      #22d3ee 277deg,
      rgba(69, 78, 112, 0.2)
        277deg
    );
}

.parent-overall-ring::before {
  position: absolute;
  width: 83px;
  height: 83px;
  border-radius: 50%;
  background: #0a0f21;
  content: "";
}

.parent-overall-ring {
  position: relative;
}

.parent-overall-ring > span {
  position: relative;
  z-index: 1;
  text-align: center;
}

.parent-overall-ring strong {
  display: block;
  font-size: 16px;
}

.parent-overall-ring small {
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.parent-subject-score
  > div:last-child
  > strong {
  font-size: 10px;
}

.parent-subject-score p {
  margin: 6px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.55;
}

.parent-subject-list {
  display: grid;
  gap: 11px;
  margin-top: 18px;
}

.parent-subject-list
  section header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  color: var(--aimers-text-secondary);
  font-size: 7px;
}

.parent-subject-list
  section header strong {
  font-weight: 500;
}

.parent-subject-list
  section
  > div {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background:
    rgba(104, 114, 153, 0.13);
}

.parent-subject-list
  section
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

.parent-subject-list small {
  display: block;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.parent-secondary-grid
  > .parent-panel {
  min-height: 300px;
}

.parent-update-list {
  display: grid;
  gap: 7px;
  margin-top: 11px;
}

.parent-update-list section {
  display: grid;
  min-height: 72px;
  grid-template-columns: 29px 1fr;
  gap: 9px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 9px;
  padding: 9px;
  background:
    rgba(255, 255, 255, 0.016);
}

.parent-update-list
  section
  > span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
}

.parent-update-list .success {
  color: #59dc9e;
  background:
    rgba(34, 197, 94, 0.09);
}

.parent-update-list .warning {
  color: #f9b44e;
  background:
    rgba(245, 158, 11, 0.09);
}

.parent-update-list .violet {
  color: #bd82ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.parent-update-list strong {
  display: block;
  font-size: 8px;
}

.parent-update-list p {
  margin: 4px 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.45;
}

.parent-update-list small {
  color: #59627f;
  font-size: 6px;
}

.parent-schedule-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.parent-schedule-list section {
  display: grid;
  min-height: 67px;
  grid-template-columns: 34px 1fr auto;
  align-items: center;
  gap: 9px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 10px;
  padding: 9px;
  background:
    rgba(255, 255, 255, 0.016);
}

.parent-schedule-list
  section
  > span {
  display: grid;
  width: 33px;
  height: 33px;
  place-items: center;
  border-radius: 9px;
  color: #a77fff;
  background:
    rgba(139, 92, 246, 0.09);
}

.parent-schedule-list strong {
  display: block;
  font-size: 8px;
}

.parent-schedule-list small {
  display: block;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.parent-schedule-list
  section
  > i {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 7px;
  color: #8f97b2;
  background:
    rgba(255, 255, 255, 0.025);
  font-size: 7px;
  font-style: normal;
}

.parent-mentor-panel {
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

.parent-mentor-panel
  .parent-panel-heading
  > svg {
  color: #c683ff;
}

.parent-mentor-message {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 11px;
  margin-top: 13px;
  padding: 12px;
  background:
    rgba(255, 255, 255, 0.017);
}

.parent-mentor-message > span {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border-radius: 10px;
  color: #bc82ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.parent-mentor-message strong {
  display: block;
  font-size: 8px;
}

.parent-mentor-message p {
  margin: 6px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.65;
}

.parent-support-actions {
  display: grid;
  gap: 7px;
  margin-top: 12px;
}

.parent-support-actions a {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 8px;
  padding: 0 10px;
  color: #a99ad0;
  background:
    rgba(139, 92, 246, 0.04);
  font-size: 7px;
  text-decoration: none;
}

.parent-privacy-strip {
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-color:
    rgba(34, 197, 94, 0.13);
  border-radius: 14px;
  padding: 12px 14px;
  background:
    linear-gradient(
      90deg,
      rgba(20, 104, 72, 0.1),
      rgba(13, 16, 33, 0.94)
    );
}

.parent-privacy-strip > div {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #57dc9c;
}

.parent-privacy-strip strong {
  display: block;
  color: white;
  font-size: 9px;
}

.parent-privacy-strip small {
  display: block;
  max-width: 850px;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.45;
}

.parent-privacy-strip > a {
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
  white-space: nowrap;
}

@media (max-width: 1450px) {
  .parent-metric-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .parent-secondary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .parent-secondary-grid
    > .parent-panel:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1080px) {
  .parent-primary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .parent-dashboard-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .parent-dashboard-heading
    > div:last-child {
    width: 100%;
  }

  .parent-dashboard-heading a {
    flex: 1;
    justify-content: center;
  }

  .parent-metric-grid,
  .parent-secondary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .parent-secondary-grid
    > .parent-panel:last-child {
    grid-column: auto;
  }
}

@media (max-width: 520px) {
  .parent-metric-grid,
  .parent-secondary-grid {
    grid-template-columns: 1fr;
  }

  .parent-chart-summary {
    overflow-x: auto;
  }

  .parent-subject-score {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .parent-privacy-strip {
    align-items: flex-start;
    flex-direction: column;
  }

  .parent-privacy-strip > a {
    width: 100%;
    justify-content: center;
  }
}
EOF

# ============================================================
# INSTITUTION PORTAL DIRECTORIES
# ============================================================

mkdir -p \
  apps/institution/src/app/router \
  apps/institution/src/app/shell \
  apps/institution/src/components/navigation \
  apps/institution/src/data \
  apps/institution/src/pages/auth \
  apps/institution/src/pages/dashboard \
  apps/institution/src/pages/shared \
  apps/institution/src/styles

# ============================================================
# INSTITUTION PACKAGE
# ============================================================

cat > apps/institution/package.json <<'EOF'
{
  "name": "@aimers/institution",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "AIMERS OS institution intelligence portal",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5178",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  }
}
EOF

cat > apps/institution/tsconfig.json <<'EOF'
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

cat > apps/institution/vite.config.ts <<'EOF'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5178
  }
});
EOF

cat > apps/institution/index.html <<'EOF'
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
      AIMERS OS — Institution Portal
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
# INSTITUTION NAVIGATION
# ============================================================

cat > apps/institution/src/data/navigation.ts <<'EOF'
import type { LucideIcon } from "lucide-react";

import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CreditCard,
  Database,
  FileText,
  Home,
  Layers3,
  Settings,
  Target,
  UserCheck,
  Users,
} from "lucide-react";

export interface InstitutionNavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const institutionNavigation:
  InstitutionNavigationItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: Home
    },
    {
      label: "Students",
      path: "/students",
      icon: Users
    },
    {
      label: "Batches",
      path: "/batches",
      icon: Layers3
    },
    {
      label: "Teachers",
      path: "/teachers",
      icon: UserCheck
    },
    {
      label: "Attendance",
      path: "/attendance",
      icon: CalendarDays
    },
    {
      label: "Performance",
      path: "/performance",
      icon: BarChart3
    },
    {
      label: "Tests",
      path: "/tests",
      icon: Target
    },
    {
      label: "Content",
      path: "/content",
      icon: BookOpen
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: Database
    },
    {
      label: "Reports",
      path: "/reports",
      icon: FileText
    },
    {
      label: "Licences",
      path: "/licences",
      icon: Building2
    },
    {
      label: "Billing",
      path: "/billing",
      icon: CreditCard
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings
    }
  ];
EOF

# ============================================================
# INSTITUTION SIDEBAR
# ============================================================

cat > apps/institution/src/components/navigation/InstitutionSidebar.tsx <<'EOF'
import {
  Brain,
  Building2,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { institutionNavigation } from "../../data/navigation";

interface InstitutionSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function InstitutionSidebar({
  open,
  onClose,
}: InstitutionSidebarProps) {
  return (
    <>
      <button
        className={
          open
            ? "institution-sidebar-backdrop visible"
            : "institution-sidebar-backdrop"
        }
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          open
            ? "institution-sidebar open"
            : "institution-sidebar"
        }
      >
        <header className="institution-brand">
          <span>
            <Brain size={25} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Institution Intelligence
            </small>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <section className="institution-workspace-card">
          <span>
            <Building2 size={16} />
          </span>

          <div>
            <small>ACTIVE INSTITUTION</small>
            <strong>AIMERS Academy</strong>
            <p>Trivandrum Campus</p>
          </div>
        </section>

        <nav className="institution-navigation">
          {institutionNavigation.map(
            (item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? "institution-nav-link active"
                      : "institution-nav-link"
                  }
                  onClick={onClose}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  <i />
                </NavLink>
              );
            },
          )}
        </nav>

        <section className="institution-security-card">
          <ShieldCheck size={17} />

          <div>
            <strong>
              Role-based access
            </strong>

            <p>
              Student and staff information is
              restricted by institution role.
            </p>
          </div>
        </section>

        <footer className="institution-profile">
          <div className="institution-avatar">
            AD
          </div>

          <div>
            <strong>Institution Admin</strong>
            <small>Academic Director</small>
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
# INSTITUTION TOPBAR
# ============================================================

cat > apps/institution/src/components/navigation/InstitutionTopbar.tsx <<'EOF'
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";

interface InstitutionTopbarProps {
  onOpenSidebar: () => void;
}

export function InstitutionTopbar({
  onOpenSidebar,
}: InstitutionTopbarProps) {
  return (
    <header className="institution-topbar">
      <div className="institution-topbar-title">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1>Institution Dashboard</h1>

          <p>
            Student, batch, teacher and
            outcome intelligence.
          </p>
        </div>
      </div>

      <button
        className="institution-search"
        type="button"
      >
        <Search size={16} />

        <span>
          Search students, batches, tests...
        </span>

        <kbd>⌘ K</kbd>
      </button>

      <div className="institution-topbar-actions">
        <span className="institution-security-status">
          <ShieldCheck size={15} />
          Secure workspace
        </span>

        <button
          className="institution-topbar-icon"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span>5</span>
        </button>

        <button
          className="institution-account"
          type="button"
        >
          <span>AD</span>

          <div>
            <strong>Institution Admin</strong>
            <small>Academic Director</small>
          </div>

          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
EOF

# ============================================================
# INSTITUTION SHELL
# ============================================================

cat > apps/institution/src/app/shell/InstitutionShell.tsx <<'EOF'
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

import { InstitutionSidebar } from "../../components/navigation/InstitutionSidebar";
import { InstitutionTopbar } from "../../components/navigation/InstitutionTopbar";

export function InstitutionShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="institution-app-shell">
      <InstitutionSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="institution-main-column">
        <InstitutionTopbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="institution-page-content">
          <Outlet />
        </main>

        <footer className="institution-system-footer">
          <span>
            <CircleCheck size={13} />
            Institution systems operational
          </span>

          <span>
            <ShieldCheck size={13} />
            Role-based access active
          </span>

          <strong>
            AIMERS Institution v2.0.0
          </strong>
        </footer>
      </div>
    </div>
  );
}
EOF

# ============================================================
# INSTITUTION DASHBOARD
# ============================================================

cat > apps/institution/src/pages/dashboard/InstitutionDashboardPage.tsx <<'EOF'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import "./institution-dashboard.css";

interface InstitutionMetricProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: string;
}

const batches = [
  {
    name: "NEET 2027 Alpha",
    students: 124,
    attendance: "94%",
    accuracy: "79%",
    risk: "Low"
  },
  {
    name: "NEET 2027 Beta",
    students: 118,
    attendance: "89%",
    accuracy: "73%",
    risk: "Medium"
  },
  {
    name: "Foundation Class 10",
    students: 96,
    attendance: "92%",
    accuracy: "81%",
    risk: "Low"
  },
  {
    name: "NEET 2026 Intensive",
    students: 82,
    attendance: "86%",
    accuracy: "71%",
    risk: "High"
  }
];

function InstitutionMetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: InstitutionMetricProps) {
  return (
    <article
      className={`institution-metric-card institution-tone-${tone}`}
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

function InstitutionPanel({
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
      className={`institution-panel ${className}`}
    >
      <header className="institution-panel-heading">
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

export function InstitutionDashboardPage() {
  return (
    <div className="institution-dashboard-page">
      <section className="institution-dashboard-heading">
        <div>
          <span>
            <Sparkles size={14} />
            INSTITUTION INTELLIGENCE
          </span>

          <h1>
            Good afternoon, Academic Director.
          </h1>

          <p>
            Attendance is stable, but one
            intensive batch needs academic
            intervention.
          </p>
        </div>

        <div>
          <Link to="/reports">
            <FileText size={14} />
            Generate report
          </Link>

          <Link to="/analytics">
            <BarChart3 size={14} />
            Open analytics
          </Link>
        </div>
      </section>

      <section className="institution-metric-grid">
        <InstitutionMetricCard
          label="ACTIVE STUDENTS"
          value="1,842"
          detail="1,716 active this week"
          icon={<Users size={17} />}
          tone="violet"
        />

        <InstitutionMetricCard
          label="ACTIVE BATCHES"
          value="18"
          detail="Six examination programmes"
          icon={<Layers3 size={17} />}
          tone="blue"
        />

        <InstitutionMetricCard
          label="AVERAGE ATTENDANCE"
          value="91.4%"
          detail="Up 2.8% this month"
          icon={<CalendarDays size={17} />}
          tone="green"
        />

        <InstitutionMetricCard
          label="AVERAGE ACCURACY"
          value="76.8%"
          detail="Across current assessments"
          icon={<Target size={17} />}
          tone="cyan"
        />

        <InstitutionMetricCard
          label="STUDENTS AT RISK"
          value="64"
          detail="17 require immediate review"
          icon={
            <AlertTriangle size={17} />
          }
          tone="danger"
        />
      </section>

      <section className="institution-primary-grid">
        <InstitutionPanel
          title="Institution Performance"
          description="Attendance, accuracy and student engagement"
          action={
            <button type="button">
              Last 12 weeks
            </button>
          }
        >
          <div className="institution-chart-summary">
            <section>
              <small>Average accuracy</small>
              <strong>76.8%</strong>
              <span>+4.2%</span>
            </section>

            <section>
              <small>Attendance</small>
              <strong>91.4%</strong>
              <span>+2.8%</span>
            </section>

            <section>
              <small>Test participation</small>
              <strong>88.7%</strong>
              <span>+6.1%</span>
            </section>
          </div>

          <div className="institution-performance-chart">
            <div className="institution-chart-axis">
              <span>100%</span>
              <span>85%</span>
              <span>70%</span>
              <span>55%</span>
              <span>40%</span>
            </div>

            <div className="institution-chart-plot">
              <svg
                viewBox="0 0 760 240"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="institutionArea"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity="0.5"
                    />

                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 185 L70 174 L140 158 L210 166 L280 139 L350 121 L420 129 L490 101 L560 86 L630 72 L700 61 L760 43 L760 240 L0 240 Z"
                  fill="url(#institutionArea)"
                />

                <polyline
                  points="0,185 70,174 140,158 210,166 280,139 350,121 420,129 490,101 560,86 630,72 700,61 760,43"
                  fill="none"
                  stroke="#9875ff"
                  strokeWidth="4"
                />

                <polyline
                  points="0,205 70,198 140,185 210,191 280,174 350,162 420,166 490,145 560,137 630,124 700,116 760,100"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                />
              </svg>

              <div>
                <span>W1</span>
                <span>W2</span>
                <span>W3</span>
                <span>W4</span>
                <span>W5</span>
                <span>W6</span>
                <span>W7</span>
                <span>W8</span>
                <span>W9</span>
                <span>W10</span>
                <span>W11</span>
                <span>W12</span>
              </div>
            </div>
          </div>

          <footer className="institution-chart-legend">
            <span>
              <i />
              Academic accuracy
            </span>

            <span>
              <i />
              Student engagement
            </span>
          </footer>
        </InstitutionPanel>

        <InstitutionPanel
          title="Institution Overview"
          description="Current operational scale"
          action={
            <Building2 size={18} />
          }
        >
          <div className="institution-overview-ring">
            <div>
              <strong>86%</strong>
              <small>Institution health</small>
            </div>
          </div>

          <div className="institution-overview-list">
            <section>
              <span>Teachers</span>
              <strong>74</strong>
            </section>

            <section>
              <span>Active courses</span>
              <strong>26</strong>
            </section>

            <section>
              <span>Tests this month</span>
              <strong>118</strong>
            </section>

            <section>
              <span>Content resources</span>
              <strong>4,820</strong>
            </section>
          </div>

          <Link
            className="institution-full-link"
            to="/analytics"
          >
            Open institution analytics
          </Link>
        </InstitutionPanel>
      </section>

      <section className="institution-table-grid">
        <InstitutionPanel
          title="Batch Performance"
          description="Current academic and attendance indicators"
          action={
            <Link to="/batches">
              View all batches
            </Link>
          }
        >
          <div className="institution-batch-table">
            <header>
              <span>Batch</span>
              <span>Students</span>
              <span>Attendance</span>
              <span>Accuracy</span>
              <span>Risk</span>
              <span />
            </header>

            {batches.map((batch) => (
              <section key={batch.name}>
                <span>
                  <i>
                    <Layers3 size={14} />
                  </i>

                  <strong>{batch.name}</strong>
                </span>

                <span>{batch.students}</span>
                <span>{batch.attendance}</span>
                <strong>{batch.accuracy}</strong>

                <span>
                  <b
                    className={batch.risk.toLowerCase()}
                  >
                    {batch.risk}
                  </b>
                </span>

                <Link to="/batches">
                  <ArrowRight size={14} />
                </Link>
              </section>
            ))}
          </div>
        </InstitutionPanel>

        <InstitutionPanel
          title="Academic Attention"
          description="Institution-wide risk summary"
          action={
            <Link to="/students">
              Review students
            </Link>
          }
        >
          <div className="institution-risk-list">
            <section>
              <span className="critical">
                <AlertTriangle size={15} />
              </span>

              <div>
                <strong>
                  Critical academic risk
                </strong>

                <small>
                  17 students require
                  immediate review
                </small>
              </div>

              <b>17</b>
            </section>

            <section>
              <span className="warning">
                <Activity size={15} />
              </span>

              <div>
                <strong>
                  Attendance decline
                </strong>

                <small>
                  28 students below target
                </small>
              </div>

              <b>28</b>
            </section>

            <section>
              <span className="violet">
                <Brain size={15} />
              </span>

              <div>
                <strong>
                  Intervention active
                </strong>

                <small>
                  46 improvement plans
                </small>
              </div>

              <b>46</b>
            </section>

            <section>
              <span className="success">
                <CheckCircle2 size={15} />
              </span>

              <div>
                <strong>
                  Intervention success
                </strong>

                <small>
                  81% positive outcomes
                </small>
              </div>

              <b>81%</b>
            </section>
          </div>
        </InstitutionPanel>
      </section>

      <section className="institution-secondary-grid">
        <InstitutionPanel
          title="Teacher Engagement"
          description="Teaching and mentoring activity"
        >
          <div className="institution-teacher-grid">
            <section>
              <span>
                <UserCheck size={17} />
              </span>

              <div>
                <small>Active today</small>
                <strong>62/74</strong>
              </div>
            </section>

            <section>
              <span>
                <BookOpen size={17} />
              </span>

              <div>
                <small>Content assigned</small>
                <strong>384</strong>
              </div>
            </section>

            <section>
              <span>
                <Target size={17} />
              </span>

              <div>
                <small>Tests reviewed</small>
                <strong>92%</strong>
              </div>
            </section>

            <section>
              <span>
                <BarChart3 size={17} />
              </span>

              <div>
                <small>Follow-up compliance</small>
                <strong>88%</strong>
              </div>
            </section>
          </div>
        </InstitutionPanel>

        <InstitutionPanel
          title="Licence Usage"
          description="Current AIMERS allocation"
          action={
            <Link to="/licences">
              Manage licences
            </Link>
          }
        >
          <div className="institution-licence-summary">
            <strong>1,842 / 2,000</strong>
            <span>Student licences used</span>
          </div>

          <div className="institution-licence-bar">
            <i />
          </div>

          <div className="institution-licence-list">
            <section>
              <span>Student licences</span>
              <strong>92.1%</strong>
            </section>

            <section>
              <span>Teacher licences</span>
              <strong>74 / 100</strong>
            </section>

            <section>
              <span>Renewal date</span>
              <strong>1 July 2027</strong>
            </section>
          </div>
        </InstitutionPanel>

        <InstitutionPanel
          title="AI Institution Insight"
          description="Aggregate institutional intelligence"
          className="institution-ai-panel"
          action={<Brain size={18} />}
        >
          <div className="institution-ai-message">
            <span>
              <Brain size={18} />
            </span>

            <div>
              <strong>
                Recommended action
              </strong>

              <p>
                NEET 2026 Intensive has lower
                attendance and accuracy. Review
                evening lecture load and create
                a two-week recovery intervention.
              </p>
            </div>
          </div>

          <Link
            className="institution-full-link"
            to="/analytics"
          >
            Open AI analysis
          </Link>
        </InstitutionPanel>
      </section>

      <section className="institution-security-strip">
        <div>
          <ShieldCheck size={19} />

          <span>
            <strong>
              Institution access controls active
            </strong>

            <small>
              Teachers, mentors and
              administrators can access only
              information permitted by their
              institution role and assignment.
            </small>
          </span>
        </div>

        <Link to="/settings">
          Review access settings
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
EOF

# ============================================================
# INSTITUTION MODULE PAGE
# ============================================================

cat > apps/institution/src/pages/shared/InstitutionModulePage.tsx <<'EOF'
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface InstitutionModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function InstitutionModulePage({
  eyebrow,
  title,
  description,
}: InstitutionModulePageProps) {
  return (
    <div className="institution-module-page">
      <header className="institution-module-hero">
        <div>
          <span>
            <Sparkles size={13} />
            {eyebrow}
          </span>

          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <button type="button">
          Generate report
          <ArrowRight size={14} />
        </button>
      </header>

      <section className="institution-module-metrics">
        <article>
          <span>
            <Building2 size={18} />
          </span>

          <div>
            <small>WORKSPACE</small>
            <strong>AIMERS Academy</strong>
          </div>
        </article>

        <article>
          <span>
            <BarChart3 size={18} />
          </span>

          <div>
            <small>ANALYTICS</small>
            <strong>Live intelligence</strong>
          </div>
        </article>

        <article>
          <span>
            <Database size={18} />
          </span>

          <div>
            <small>DATA</small>
            <strong>Synchronised</strong>
          </div>
        </article>

        <article>
          <span>
            <ShieldCheck size={18} />
          </span>

          <div>
            <small>ACCESS</small>
            <strong>Role protected</strong>
          </div>
        </article>
      </section>

      <section className="institution-module-content">
        <article>
          <header>
            <div>
              <span>INSTITUTION WORKSPACE</span>
              <h2>{title} Overview</h2>
            </div>

            <button type="button">
              Configure view
            </button>
          </header>

          <div className="institution-module-placeholder">
            <span>
              <Brain size={43} />
            </span>

            <h3>
              {title} workspace prepared
            </h3>

            <p>
              The responsive institution
              interface, role boundary and
              analytics structure are ready.
              Real institution data will be
              connected through the authorised
              API.
            </p>
          </div>
        </article>

        <aside>
          <span>INSTITUTION AI</span>

          <h2>
            Cohort and outcome intelligence is
            ready.
          </h2>

          <p>
            AIMERS will combine student,
            teacher, batch, content and test
            information into aggregate
            institution-level insights.
          </p>

          <button type="button">
            Open institution guide
          </button>
        </aside>
      </section>
    </div>
  );
}
EOF

# ============================================================
# INSTITUTION LOGIN
# ============================================================

cat > apps/institution/src/pages/auth/InstitutionLoginPage.tsx <<'EOF'
import {
  ArrowRight,
  Brain,
  Building2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export function InstitutionLoginPage() {
  return (
    <div className="institution-login-page">
      <section className="institution-login-visual">
        <div className="institution-login-brand">
          <span>
            <Brain size={27} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Institution Intelligence
            </small>
          </div>
        </div>

        <div>
          <span>
            INSTITUTION LEARNING OPERATING SYSTEM
          </span>

          <h1>
            Improve outcomes across every
            batch and classroom.
          </h1>

          <p>
            Connect students, teachers,
            assessments, content and
            interventions through one
            institution intelligence platform.
          </p>

          <section>
            <ShieldCheck size={18} />

            <div>
              <strong>
                Role-based institution access
              </strong>

              <small>
                Sensitive student and staff
                views are securely controlled.
              </small>
            </div>
          </section>
        </div>
      </section>

      <section className="institution-login-form">
        <form
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <span>
            AIMERS INSTITUTION PORTAL
          </span>

          <h2>Institution sign in</h2>

          <p>
            Use your authorised institution
            administrator account.
          </p>

          <label>
            <span>Institution email</span>

            <div>
              <Mail size={16} />

              <input
                type="email"
                placeholder="admin@institution.edu"
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
            <Building2 size={15} />
            Open institution workspace
            <ArrowRight size={15} />
          </button>

          <small>
            Access is restricted to authorised
            institution users.
          </small>
        </form>
      </section>
    </div>
  );
}
EOF

# ============================================================
# INSTITUTION ROUTER
# ============================================================

cat > apps/institution/src/app/router/InstitutionRouter.tsx <<'EOF'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { InstitutionShell } from "../shell/InstitutionShell";

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
      </Routes>
    </BrowserRouter>
  );
}
EOF

cat > apps/institution/src/app/App.tsx <<'EOF'
import { InstitutionRouter } from "./router/InstitutionRouter";

export function App() {
  return <InstitutionRouter />;
}
EOF

cat > apps/institution/src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";

import "./styles/index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error(
    "AIMERS institution root element was not found.",
  );
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

cat > apps/institution/src/vite-env.d.ts <<'EOF'
/// <reference types="vite/client" />
EOF

# ============================================================
# INSTITUTION CSS
# ============================================================

cat > apps/institution/src/styles/index.css <<'EOF'
@import "@aimers/design-tokens/tokens.css";
@import "./institution.css";
@import "../pages/dashboard/institution-dashboard.css";
EOF

cat > apps/institution/src/styles/institution.css <<'EOF'
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

.institution-app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns:
    242px minmax(0, 1fr);
}

.institution-sidebar {
  position: sticky;
  z-index: 70;
  top: 0;
  display: grid;
  height: 100vh;
  grid-template-rows:
    auto auto minmax(0, 1fr) auto auto;
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

.institution-brand {
  display: grid;
  grid-template-columns: 39px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 4px 5px 15px;
}

.institution-brand > span {
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
}

.institution-brand strong {
  display: block;
  font-size: 14px;
  letter-spacing: 0.14em;
}

.institution-brand strong i {
  color: #a56dff;
  font-style: normal;
}

.institution-brand small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.institution-brand > button {
  display: none;
  width: 31px;
  height: 31px;
  place-items: center;
  border: 0;
  border-radius: 9px;
  color: var(--aimers-text-secondary);
  background:
    rgba(255, 255, 255, 0.035);
}

.institution-workspace-card {
  display: grid;
  grid-template-columns: 31px 1fr;
  align-items: center;
  gap: 9px;
  border: 1px solid
    rgba(139, 92, 246, 0.18);
  border-radius: 12px;
  margin-bottom: 14px;
  padding: 9px;
  background:
    rgba(118, 69, 201, 0.07);
}

.institution-workspace-card > span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 9px;
  color: #bf89ff;
  background:
    rgba(139, 92, 246, 0.1);
}

.institution-workspace-card small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.09em;
}

.institution-workspace-card strong {
  display: block;
  margin-top: 3px;
  font-size: 9px;
}

.institution-workspace-card p {
  margin: 2px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.institution-navigation {
  overflow-y: auto;
  padding-right: 3px;
}

.institution-nav-link {
  display: grid;
  min-height: 38px;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 9px;
  margin-bottom: 3px;
  padding: 0 9px;
  color: #aeb5ca;
  font-size: 10px;
  text-decoration: none;
}

.institution-nav-link:hover {
  color: white;
  background:
    rgba(139, 92, 246, 0.055);
}

.institution-nav-link.active {
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

.institution-nav-link > i {
  display: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c07aff;
  box-shadow: 0 0 8px #a855f7;
}

.institution-nav-link.active > i {
  display: block;
}

.institution-security-card {
  display: grid;
  grid-template-columns: 25px 1fr;
  gap: 8px;
  border: 1px solid
    rgba(34, 197, 94, 0.13);
  border-radius: 11px;
  margin-top: 10px;
  padding: 10px;
  color: #56db9c;
  background:
    rgba(34, 197, 94, 0.035);
}

.institution-security-card strong {
  display: block;
  color: white;
  font-size: 8px;
}

.institution-security-card p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 6px;
  line-height: 1.5;
}

.institution-profile {
  display: grid;
  grid-template-columns: 34px 1fr 30px;
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

.institution-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background:
    linear-gradient(
      135deg,
      #4f2a89,
      #1e3f64
    );
  font-size: 9px;
  font-weight: 800;
}

.institution-profile strong {
  display: block;
  font-size: 9px;
}

.institution-profile small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.institution-profile button {
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

.institution-sidebar-backdrop {
  display: none;
}

.institution-main-column {
  min-width: 0;
}

.institution-topbar {
  position: sticky;
  z-index: 50;
  top: 0;
  display: grid;
  min-height: 72px;
  grid-template-columns:
    minmax(250px, 0.8fr)
    minmax(280px, 1.1fr)
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

.institution-topbar-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.institution-topbar-title > button {
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

.institution-topbar-title h1 {
  margin: 0;
  font-size: 15px;
}

.institution-topbar-title p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.institution-search {
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

.institution-search kbd {
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

.institution-topbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.institution-security-status {
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

.institution-topbar-icon {
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

.institution-topbar-icon > span {
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

.institution-account {
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

.institution-account > span {
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

.institution-account strong {
  display: block;
  font-size: 8px;
}

.institution-account small {
  display: block;
  margin-top: 2px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.institution-page-content {
  min-height:
    calc(100vh - 111px);
  padding: 14px;
}

.institution-system-footer {
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

.institution-system-footer span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.institution-system-footer
  span:first-child {
  color: #54d89b;
}

.institution-module-page {
  display: grid;
  gap: 12px;
}

.institution-module-hero {
  display: flex;
  min-height: 190px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
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

.institution-module-hero
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

.institution-module-hero h1 {
  margin: 12px 0 8px;
  font-size:
    clamp(35px, 5vw, 62px);
  letter-spacing: -0.06em;
}

.institution-module-hero p {
  max-width: 720px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.6;
}

.institution-module-hero button,
.institution-module-content button {
  display: flex;
  min-height: 39px;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 10px;
  padding: 0 14px;
  color: white;
  background:
    var(--aimers-gradient-primary);
  font-size: 9px;
  font-weight: 700;
}

.institution-module-metrics {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.institution-module-metrics article {
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

.institution-module-metrics
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

.institution-module-metrics small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 7px;
  letter-spacing: 0.11em;
}

.institution-module-metrics strong {
  display: block;
  margin-top: 4px;
  font-size: 11px;
}

.institution-module-content {
  display: grid;
  grid-template-columns:
    minmax(0, 1.5fr)
    minmax(280px, 0.5fr);
  gap: 12px;
}

.institution-module-content > article,
.institution-module-content > aside {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 18px;
  background: var(--aimers-surface-1);
}

.institution-module-content > article {
  min-height: 430px;
  padding: 20px;
}

.institution-module-content
  > article
  > header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.institution-module-content
  > article
  > header span,
.institution-module-content
  > aside
  > span {
  color: #a486d3;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.institution-module-content h2 {
  margin: 7px 0 0;
  font-size: 19px;
}

.institution-module-content
  > article
  > header button {
  background:
    rgba(139, 92, 246, 0.1);
}

.institution-module-placeholder {
  display: grid;
  min-height: 335px;
  place-content: center;
  justify-items: center;
  text-align: center;
}

.institution-module-placeholder > span {
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
}

.institution-module-placeholder h3 {
  margin: 18px 0 8px;
}

.institution-module-placeholder p {
  max-width: 500px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.institution-module-content > aside {
  padding: 22px;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(221, 62, 203, 0.13),
      transparent 33%
    ),
    var(--aimers-surface-1);
}

.institution-module-content
  > aside p {
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.institution-module-content
  > aside button {
  margin-top: 17px;
}

.institution-login-page {
  display: grid;
  min-height: 100vh;
  grid-template-columns:
    minmax(430px, 0.95fr)
    minmax(460px, 1.05fr);
}

.institution-login-visual {
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

.institution-login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.institution-login-brand > span {
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

.institution-login-brand strong {
  display: block;
  letter-spacing: 0.14em;
}

.institution-login-brand strong i {
  color: #a86dff;
  font-style: normal;
}

.institution-login-brand small {
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.institution-login-visual
  > div:last-child
  > span {
  color: #ae8ae1;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.institution-login-visual h1 {
  max-width: 700px;
  margin: 18px 0;
  font-size:
    clamp(42px, 5.5vw, 74px);
  letter-spacing: -0.065em;
  line-height: 1;
}

.institution-login-visual
  > div:last-child
  > p {
  max-width: 610px;
  color: var(--aimers-text-secondary);
  line-height: 1.75;
}

.institution-login-visual
  > div:last-child
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

.institution-login-visual
  section strong {
  display: block;
  color: white;
  font-size: 10px;
}

.institution-login-visual
  section small {
  display: block;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.institution-login-form {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 30px;
}

.institution-login-form form {
  display: grid;
  width: min(430px, 100%);
}

.institution-login-form
  form
  > span {
  color: #aa85d7;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.institution-login-form h2 {
  margin: 14px 0 9px;
  font-size: 35px;
  letter-spacing: -0.05em;
}

.institution-login-form
  form
  > p {
  margin: 0 0 28px;
  color: var(--aimers-text-muted);
}

.institution-login-form label {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.institution-login-form
  label
  > span {
  color: var(--aimers-text-secondary);
  font-size: 10px;
}

.institution-login-form
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

.institution-login-form input {
  min-width: 0;
  border: 0;
  outline: 0;
  color: white;
  background: transparent;
}

.institution-login-form
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

.institution-login-form
  form
  > small {
  margin-top: 18px;
  color: var(--aimers-text-muted);
  font-size: 8px;
  text-align: center;
}

@media (max-width: 1180px) {
  .institution-app-shell {
    grid-template-columns: 1fr;
  }

  .institution-sidebar {
    position: fixed;
    left: 0;
    width:
      min(
        242px,
        calc(100vw - 44px)
      );
    transform: translateX(-105%);
    transition:
      transform
      var(--aimers-transition);
  }

  .institution-sidebar.open {
    transform: translateX(0);
  }

  .institution-sidebar-backdrop {
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

  .institution-sidebar-backdrop.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .institution-brand > button,
  .institution-topbar-title > button {
    display: grid;
  }
}

@media (max-width: 900px) {
  .institution-topbar {
    grid-template-columns: 1fr auto;
  }

  .institution-search,
  .institution-security-status {
    display: none;
  }

  .institution-account div,
  .institution-account > svg {
    display: none;
  }

  .institution-account {
    grid-template-columns: 31px;
  }

  .institution-module-content {
    grid-template-columns: 1fr;
  }

  .institution-login-page {
    grid-template-columns: 1fr;
  }

  .institution-login-visual {
    min-height: 540px;
  }

  .institution-login-form {
    min-height: 680px;
  }
}

@media (max-width: 680px) {
  .institution-topbar {
    padding: 8px 10px;
  }

  .institution-topbar-title p {
    display: none;
  }

  .institution-topbar-title h1 {
    font-size: 13px;
  }

  .institution-page-content {
    padding: 9px;
  }

  .institution-system-footer
    span:nth-child(2) {
    display: none;
  }

  .institution-module-hero {
    min-height: 250px;
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .institution-module-metrics {
    grid-template-columns: 1fr 1fr;
  }

  .institution-login-visual {
    min-height: 580px;
    padding: 25px 20px 55px;
  }

  .institution-login-form {
    padding: 24px 18px;
  }
}
EOF

cat > apps/institution/src/pages/dashboard/institution-dashboard.css <<'EOF'
.institution-dashboard-page {
  display: grid;
  gap: 11px;
}

.institution-dashboard-heading {
  display: flex;
  min-height: 104px;
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

.institution-dashboard-heading
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

.institution-dashboard-heading h1 {
  margin: 7px 0 4px;
  font-size: 23px;
  letter-spacing: -0.03em;
}

.institution-dashboard-heading p {
  margin: 0;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.institution-dashboard-heading
  > div:last-child {
  display: flex;
  gap: 8px;
}

.institution-dashboard-heading a {
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

.institution-dashboard-heading
  a:last-child {
  color: white;
  background:
    var(--aimers-gradient-primary);
}

.institution-metric-grid {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(0, 1fr));
  gap: 9px;
}

.institution-metric-card,
.institution-panel,
.institution-security-strip {
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

.institution-metric-card {
  min-height: 138px;
  border-radius: 14px;
  padding: 13px;
}

.institution-metric-card header {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 7px;
}

.institution-metric-card
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

.institution-metric-card
  header small {
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.1em;
}

.institution-metric-card
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

.institution-metric-card > strong {
  display: block;
  margin-top: 15px;
  color: white;
  font-size: 24px;
  font-weight: 500;
}

.institution-metric-card > p {
  margin: 3px 0 10px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.institution-metric-card footer {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #52da99;
  font-size: 7px;
}

.institution-tone-violet {
  color: #a47bff;
}

.institution-tone-blue {
  color: #538bff;
}

.institution-tone-green {
  color: #4cdb96;
}

.institution-tone-cyan {
  color: #3cd8e9;
}

.institution-tone-danger {
  color: #ff6680;
}

.institution-primary-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.5fr)
    minmax(340px, 0.5fr);
  gap: 10px;
}

.institution-table-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.35fr)
    minmax(340px, 0.65fr);
  gap: 10px;
}

.institution-secondary-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.institution-panel {
  min-width: 0;
  border-radius: 15px;
  padding: 14px;
}

.institution-panel-heading {
  display: flex;
  min-height: 35px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
}

.institution-panel-heading h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
}

.institution-panel-heading p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.institution-panel-heading a {
  color: #a895d3;
  font-size: 7px;
  text-decoration: none;
}

.institution-panel-heading button {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 7px;
  padding: 4px 7px;
  color: var(--aimers-text-secondary);
  background:
    rgba(255, 255, 255, 0.025);
  font-size: 7px;
}

.institution-chart-summary {
  display: flex;
  gap: 30px;
  border-bottom: 1px solid
    var(--aimers-border-soft);
  margin-top: 6px;
  padding: 10px 0 13px;
}

.institution-chart-summary section {
  display: grid;
  gap: 4px;
}

.institution-chart-summary small {
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.institution-chart-summary strong {
  font-size: 15px;
  font-weight: 500;
}

.institution-chart-summary span {
  color: #53da99;
  font-size: 7px;
}

.institution-performance-chart {
  display: grid;
  height: 245px;
  grid-template-columns: 31px 1fr;
  gap: 5px;
  margin-top: 12px;
}

.institution-chart-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 20px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.institution-chart-plot {
  border-left: 1px solid
    rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.04);
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 50px,
      rgba(255, 255, 255, 0.035)
        51px
    );
}

.institution-chart-plot svg {
  width: 100%;
  height: 215px;
}

.institution-chart-plot > div {
  display: flex;
  justify-content: space-between;
  padding-top: 5px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.institution-chart-legend {
  display: flex;
  gap: 14px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.institution-chart-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.institution-chart-legend i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8b5cf6;
}

.institution-chart-legend
  span:last-child i {
  background: #22d3ee;
}

.institution-overview-ring {
  display: grid;
  width: 130px;
  height: 130px;
  place-items: center;
  border-radius: 50%;
  margin: 14px auto;
  background:
    conic-gradient(
      #7c3aed 0deg,
      #22d3ee 310deg,
      rgba(69, 78, 112, 0.2)
        310deg
    );
}

.institution-overview-ring::before {
  position: absolute;
  width: 103px;
  height: 103px;
  border-radius: 50%;
  background: #0a0f21;
  content: "";
}

.institution-overview-ring {
  position: relative;
}

.institution-overview-ring > div {
  position: relative;
  z-index: 1;
  text-align: center;
}

.institution-overview-ring strong {
  display: block;
  font-size: 19px;
}

.institution-overview-ring small {
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.institution-overview-list {
  display: grid;
  gap: 7px;
}

.institution-overview-list section {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
  padding-bottom: 7px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.institution-overview-list strong {
  color: white;
  font-size: 8px;
}

.institution-full-link {
  display: flex;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 8px;
  margin-top: 14px;
  color: #a795d0;
  background:
    rgba(139, 92, 246, 0.04);
  font-size: 7px;
  text-decoration: none;
}

.institution-batch-table {
  margin-top: 10px;
}

.institution-batch-table > header,
.institution-batch-table > section {
  display: grid;
  min-height: 47px;
  grid-template-columns:
    1.45fr 0.55fr 0.7fr 0.65fr 0.55fr 24px;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
  font-size: 7px;
}

.institution-batch-table > header {
  min-height: 30px;
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.07em;
}

.institution-batch-table
  > section
  > span:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
}

.institution-batch-table
  > section
  > span:first-child i {
  display: grid;
  width: 29px;
  height: 29px;
  place-items: center;
  border-radius: 8px;
  color: #b985ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.institution-batch-table
  > section
  > span {
  color: var(--aimers-text-secondary);
}

.institution-batch-table
  > section
  > strong {
  font-size: 8px;
}

.institution-batch-table b {
  border-radius: 999px;
  padding: 3px 6px;
  font-size: 6px;
  font-weight: 500;
}

.institution-batch-table b.high {
  color: #ff7186;
  background:
    rgba(239, 71, 111, 0.08);
}

.institution-batch-table b.medium {
  color: #f6b04b;
  background:
    rgba(245, 158, 11, 0.08);
}

.institution-batch-table b.low {
  color: #55d99a;
  background:
    rgba(34, 197, 94, 0.08);
}

.institution-batch-table
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

.institution-risk-list {
  display: grid;
  gap: 7px;
  margin-top: 11px;
}

.institution-risk-list section {
  display: grid;
  min-height: 63px;
  grid-template-columns: 31px 1fr auto;
  align-items: center;
  gap: 9px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 9px;
  padding: 9px;
  background:
    rgba(255, 255, 255, 0.016);
}

.institution-risk-list
  section
  > span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
}

.institution-risk-list .critical {
  color: #ff6f85;
  background:
    rgba(239, 71, 111, 0.09);
}

.institution-risk-list .warning {
  color: #f8b34d;
  background:
    rgba(245, 158, 11, 0.09);
}

.institution-risk-list .violet {
  color: #bc82ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.institution-risk-list .success {
  color: #59dc9e;
  background:
    rgba(34, 197, 94, 0.09);
}

.institution-risk-list strong {
  display: block;
  font-size: 8px;
}

.institution-risk-list small {
  display: block;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.institution-risk-list b {
  color: white;
  font-size: 9px;
}

.institution-secondary-grid
  > .institution-panel {
  min-height: 285px;
}

.institution-teacher-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 13px;
}

.institution-teacher-grid section {
  display: flex;
  min-height: 90px;
  align-items: center;
  gap: 10px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 10px;
  padding: 10px;
  background:
    rgba(255, 255, 255, 0.016);
}

.institution-teacher-grid
  section
  > span {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border-radius: 9px;
  color: #b985ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.institution-teacher-grid small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.institution-teacher-grid strong {
  display: block;
  margin-top: 4px;
  font-size: 13px;
}

.institution-licence-summary {
  margin-top: 18px;
}

.institution-licence-summary strong {
  display: block;
  font-size: 22px;
  font-weight: 500;
}

.institution-licence-summary span {
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.institution-licence-bar {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  margin-top: 15px;
  background:
    rgba(104, 114, 153, 0.13);
}

.institution-licence-bar i {
  display: block;
  width: 92.1%;
  height: 100%;
  border-radius: inherit;
  background:
    linear-gradient(
      90deg,
      #6d4ce7,
      #22d3ee
    );
}

.institution-licence-list {
  display: grid;
  gap: 9px;
  margin-top: 17px;
}

.institution-licence-list section {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
  padding-bottom: 7px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.institution-licence-list strong {
  color: white;
  font-size: 8px;
}

.institution-ai-panel {
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

.institution-ai-panel
  .institution-panel-heading
  > svg {
  color: #c683ff;
}

.institution-ai-message {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 11px;
  margin-top: 14px;
  padding: 12px;
  background:
    rgba(255, 255, 255, 0.017);
}

.institution-ai-message > span {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border-radius: 10px;
  color: #bc82ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.institution-ai-message strong {
  display: block;
  font-size: 8px;
}

.institution-ai-message p {
  margin: 6px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.65;
}

.institution-security-strip {
  display: flex;
  min-height: 70px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-color:
    rgba(34, 197, 94, 0.13);
  border-radius: 14px;
  padding: 12px 14px;
  background:
    linear-gradient(
      90deg,
      rgba(20, 104, 72, 0.1),
      rgba(13, 16, 33, 0.94)
    );
}

.institution-security-strip > div {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #57dc9c;
}

.institution-security-strip strong {
  display: block;
  color: white;
  font-size: 9px;
}

.institution-security-strip small {
  display: block;
  max-width: 850px;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.45;
}

.institution-security-strip > a {
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
  white-space: nowrap;
}

@media (max-width: 1450px) {
  .institution-metric-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .institution-secondary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .institution-secondary-grid
    > .institution-panel:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1080px) {
  .institution-primary-grid,
  .institution-table-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .institution-dashboard-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .institution-dashboard-heading
    > div:last-child {
    width: 100%;
  }

  .institution-dashboard-heading a {
    flex: 1;
    justify-content: center;
  }

  .institution-metric-grid,
  .institution-secondary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .institution-secondary-grid
    > .institution-panel:last-child {
    grid-column: auto;
  }

  .institution-batch-table {
    overflow-x: auto;
  }

  .institution-batch-table > header,
  .institution-batch-table > section {
    min-width: 650px;
  }
}

@media (max-width: 520px) {
  .institution-metric-grid,
  .institution-secondary-grid {
    grid-template-columns: 1fr;
  }

  .institution-chart-summary {
    overflow-x: auto;
  }

  .institution-teacher-grid {
    grid-template-columns: 1fr;
  }

  .institution-security-strip {
    align-items: flex-start;
    flex-direction: column;
  }

  .institution-security-strip > a {
    width: 100%;
    justify-content: center;
  }
}
EOF

echo "Parent and institution portals created successfully."
