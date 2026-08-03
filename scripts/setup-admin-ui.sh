#!/usr/bin/env bash

set -euo pipefail

echo "Creating AIMERS OS CEO administration dashboard..."

mkdir -p \
  apps/admin/src/app/router \
  apps/admin/src/app/shell \
  apps/admin/src/components/navigation \
  apps/admin/src/components/dashboard \
  apps/admin/src/data \
  apps/admin/src/pages/overview \
  apps/admin/src/pages/shared \
  apps/admin/src/styles

# ============================================================
# PACKAGE CONFIGURATION
# ============================================================

cat > apps/admin/package.json <<'EOF'
{
  "name": "@aimers/admin",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "AIMERS OS CEO and company administration dashboard",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5175",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  }
}
EOF

cat > apps/admin/tsconfig.json <<'EOF'
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

cat > apps/admin/vite.config.ts <<'EOF'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5175,
  },
});
EOF

cat > apps/admin/index.html <<'EOF'
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
      AIMERS OS — Company Administration
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
# NAVIGATION DATA
# ============================================================

cat > apps/admin/src/data/navigation.ts <<'EOF'
import type { LucideIcon } from "lucide-react";

import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CreditCard,
  Database,
  FileText,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  Settings,
  ShieldCheck,
  Target,
  UserCheck,
  UserCog,
  Users,
  Zap,
} from "lucide-react";

export interface AdminNavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface AdminNavigationGroup {
  label: string;
  items: AdminNavigationItem[];
}

export const adminNavigation: AdminNavigationGroup[] = [
  {
    label: "COMMAND CENTRE",
    items: [
      {
        label: "Overview",
        path: "/overview",
        icon: LayoutDashboard,
      },
      {
        label: "Notifications",
        path: "/notifications",
        icon: Bell,
      },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      {
        label: "Revenue",
        path: "/revenue",
        icon: BarChart3,
      },
      {
        label: "Subscriptions",
        path: "/subscriptions",
        icon: CreditCard,
      },
      {
        label: "Customers",
        path: "/customers",
        icon: Users,
      },
    ],
  },
  {
    label: "LEARNERS",
    items: [
      {
        label: "Students",
        path: "/students",
        icon: Users,
      },
      {
        label: "Cohorts",
        path: "/cohorts",
        icon: UserCheck,
      },
      {
        label: "Rankers",
        path: "/rankers",
        icon: Target,
      },
      {
        label: "Mentors",
        path: "/mentors",
        icon: UserCog,
      },
      {
        label: "Staff",
        path: "/staff",
        icon: UserCog,
      },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      {
        label: "Learning Analytics",
        path: "/learning-analytics",
        icon: BarChart3,
      },
      {
        label: "Product Analytics",
        path: "/product-analytics",
        icon: Gauge,
      },
      {
        label: "Behavior Analytics",
        path: "/behavior-analytics",
        icon: Activity,
      },
      {
        label: "Digital Activity",
        path: "/digital-activity",
        icon: Zap,
      },
      {
        label: "AI Operations",
        path: "/ai-operations",
        icon: Brain,
      },
      {
        label: "Predictions",
        path: "/predictions",
        icon: Target,
      },
    ],
  },
  {
    label: "OPTIMISATION",
    items: [
      {
        label: "Experiments",
        path: "/experiments",
        icon: FlaskConical,
      },
      {
        label: "Interventions",
        path: "/interventions",
        icon: Zap,
      },
      {
        label: "Content",
        path: "/content-management",
        icon: FileText,
      },
      {
        label: "Question Bank",
        path: "/question-bank",
        icon: Database,
      },
      {
        label: "Mock Tests",
        path: "/mock-tests",
        icon: Target,
      },
    ],
  },
  {
    label: "TRUST & OPERATIONS",
    items: [
      {
        label: "Privacy",
        path: "/privacy",
        icon: ShieldCheck,
      },
      {
        label: "Consents",
        path: "/consents",
        icon: UserCheck,
      },
      {
        label: "Audit Logs",
        path: "/audit-logs",
        icon: FileText,
      },
      {
        label: "Data Requests",
        path: "/data-requests",
        icon: Database,
      },
      {
        label: "Security",
        path: "/security",
        icon: LockKeyhole,
      },
      {
        label: "System Health",
        path: "/system-health",
        icon: Gauge,
      },
      {
        label: "Feature Flags",
        path: "/feature-flags",
        icon: FlaskConical,
      },
      {
        label: "Support",
        path: "/support",
        icon: LifeBuoy,
      },
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
];
EOF

# ============================================================
# SIDEBAR
# ============================================================

cat > apps/admin/src/components/navigation/AdminSidebar.tsx <<'EOF'
import {
  Brain,
  LogOut,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import { adminNavigation } from "../../data/navigation";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({
  open,
  onClose,
}: AdminSidebarProps) {
  const location = useLocation();

  return (
    <>
      <button
        className={
          open
            ? "admin-sidebar-backdrop visible"
            : "admin-sidebar-backdrop"
        }
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          open
            ? "admin-sidebar open"
            : "admin-sidebar"
        }
      >
        <header className="admin-sidebar-brand">
          <span>
            <Brain size={25} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Company Intelligence
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

        <section className="admin-role-card">
          <div>
            <ShieldCheck size={15} />
          </div>

          <span>
            <small>ACTIVE WORKSPACE</small>
            <strong>
              CEO Command Centre
            </strong>
          </span>

          <i>LIVE</i>
        </section>

        <nav className="admin-sidebar-navigation">
          {adminNavigation.map((group) => (
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
                        ? "admin-sidebar-link active"
                        : "admin-sidebar-link"
                    }
                    onClick={onClose}
                  >
                    <Icon size={16} />

                    <span>{item.label}</span>

                    {location.pathname ===
                      item.path && <i />}
                  </NavLink>
                );
              })}
            </section>
          ))}
        </nav>

        <footer className="admin-sidebar-profile">
          <div className="admin-profile-avatar">
            RN
          </div>

          <div>
            <strong>Ram N.</strong>
            <small>
              Founder & CEO
            </small>
          </div>

          <NavLink
            to="/settings"
            aria-label="Settings"
          >
            <Settings size={15} />
          </NavLink>

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

cat > apps/admin/src/components/navigation/AdminTopbar.tsx <<'EOF'
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";

interface AdminTopbarProps {
  onOpenSidebar: () => void;
}

export function AdminTopbar({
  onOpenSidebar,
}: AdminTopbarProps) {
  const [environment, setEnvironment] =
    useState("Production");

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-title">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1>Company Overview</h1>

          <p>
            Real-time business, learner and
            system intelligence.
          </p>
        </div>
      </div>

      <button
        className="admin-global-search"
        type="button"
      >
        <Search size={16} />
        <span>
          Search students, customers, reports...
        </span>
        <kbd>⌘ K</kbd>
      </button>

      <div className="admin-topbar-actions">
        <button
          className="environment-selector"
          type="button"
          onClick={() =>
            setEnvironment((current) =>
              current === "Production"
                ? "Staging"
                : "Production",
            )
          }
        >
          <span />
          {environment}
          <ChevronDown size={13} />
        </button>

        <button
          className="admin-topbar-icon"
          type="button"
          aria-label="Security status"
        >
          <ShieldCheck size={17} />
        </button>

        <button
          className="admin-topbar-icon"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span>4</span>
        </button>

        <button
          className="admin-account-button"
          type="button"
        >
          <span>RN</span>

          <div>
            <strong>Ram N.</strong>
            <small>Founder & CEO</small>
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

cat > apps/admin/src/app/shell/AdminShell.tsx <<'EOF'
import {
  Activity,
  CircleCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import { AdminSidebar } from "../../components/navigation/AdminSidebar";
import { AdminTopbar } from "../../components/navigation/AdminTopbar";

export function AdminShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-app-shell">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="admin-main-column">
        <AdminTopbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="admin-page-content">
          <Outlet />
        </main>

        <footer className="admin-system-footer">
          <span>
            <CircleCheck size={13} />
            All production systems operational
          </span>

          <span>
            <Activity size={13} />
            Live data refreshed 12 seconds ago
          </span>

          <strong>
            AIMERS OS Admin v2.0.0
          </strong>
        </footer>
      </div>
    </div>
  );
}
EOF

# ============================================================
# ADMIN DASHBOARD
# ============================================================

cat > apps/admin/src/pages/overview/AdminOverviewPage.tsx <<'EOF'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Check,
  Clock,
  CreditCard,
  Database,
  IndianRupee,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

import type {
  CSSProperties,
  ReactNode,
} from "react";

import { Link } from "react-router-dom";

import "./admin-overview.css";

interface MetricProps {
  label: string;
  value: string;
  detail: string;
  change: string;
  positive?: boolean;
  icon: ReactNode;
  tone: string;
}

const subscriptions = [
  {
    customer: "Arjun Menon",
    plan: "AIMERS Pro",
    amount: "₹699",
    status: "Active",
    time: "2 min ago",
  },
  {
    customer: "Nayana S.",
    plan: "AIMERS Plus",
    amount: "₹299",
    status: "Active",
    time: "8 min ago",
  },
  {
    customer: "Vivek Raj",
    plan: "AIMERS Elite",
    amount: "₹1,499",
    status: "Trial",
    time: "14 min ago",
  },
  {
    customer: "Maya Thomas",
    plan: "AIMERS Pro",
    amount: "₹699",
    status: "Active",
    time: "22 min ago",
  },
];

const interventions = [
  {
    student: "Akhil P.",
    reason: "High distraction risk",
    action: "Focus-plan assigned",
    outcome: "+18% focus",
  },
  {
    student: "Diya R.",
    reason: "Chemistry backlog",
    action: "Revision queue created",
    outcome: "In progress",
  },
  {
    student: "Sanjay K.",
    reason: "Low test accuracy",
    action: "Mentor review requested",
    outcome: "+9% accuracy",
  },
];

function MetricCard({
  label,
  value,
  detail,
  change,
  positive = true,
  icon,
  tone,
}: MetricProps) {
  return (
    <article
      className={`admin-metric-card admin-tone-${tone}`}
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

      <footer
        className={
          positive
            ? "positive"
            : "negative"
        }
      >
        {positive ? (
          <TrendingUp size={13} />
        ) : (
          <TrendingDown size={13} />
        )}

        {change}
      </footer>
    </article>
  );
}

function AdminPanel({
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
      className={`admin-panel ${className}`}
    >
      <header className="admin-panel-heading">
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

export function AdminOverviewPage() {
  return (
    <div className="admin-overview-page">
      <section className="admin-overview-heading">
        <div>
          <span>
            <Sparkles size={14} />
            MONDAY, 3 AUGUST 2026
          </span>

          <h1>
            Good afternoon, Ram.
          </h1>

          <p>
            AIMERS gained 127 students today
            and all critical services are
            healthy.
          </p>
        </div>

        <div>
          <button type="button">
            Export report
          </button>

          <button type="button">
            <Zap size={15} />
            Create intervention
          </button>
        </div>
      </section>

      <section className="admin-metric-grid">
        <MetricCard
          label="MONTHLY RECURRING REVENUE"
          value="₹18.42L"
          detail="Annual run rate: ₹2.21Cr"
          change="12.8% this month"
          icon={<IndianRupee size={17} />}
          tone="violet"
        />

        <MetricCard
          label="ACTIVE SUBSCRIPTIONS"
          value="4,812"
          detail="318 new this month"
          change="8.4% this month"
          icon={<CreditCard size={17} />}
          tone="blue"
        />

        <MetricCard
          label="ACTIVE STUDENTS"
          value="6,284"
          detail="4,921 active this week"
          change="6.7% this month"
          icon={<Users size={17} />}
          tone="cyan"
        />

        <MetricCard
          label="AI OPERATING COST"
          value="₹1.84L"
          detail="₹29.28 per active student"
          change="4.1% cost reduction"
          icon={<Brain size={17} />}
          tone="pink"
        />

        <MetricCard
          label="SUBSCRIPTION CHURN"
          value="2.7%"
          detail="Target remains below 3%"
          change="0.4% improvement"
          icon={<Activity size={17} />}
          tone="green"
        />
      </section>

      <section className="admin-primary-grid">
        <AdminPanel
          title="Revenue and Subscriber Growth"
          description="Monthly recurring revenue and paid subscribers"
          className="growth-panel"
          action={
            <button className="admin-panel-filter">
              Last 12 months
            </button>
          }
        >
          <div className="growth-chart-summary">
            <section>
              <small>MRR</small>
              <strong>₹18.42L</strong>
              <span>
                <ArrowUpRight size={12} />
                12.8%
              </span>
            </section>

            <section>
              <small>Paid subscribers</small>
              <strong>4,812</strong>
              <span>
                <ArrowUpRight size={12} />
                8.4%
              </span>
            </section>

            <section>
              <small>ARPU</small>
              <strong>₹383</strong>
              <span>
                <ArrowUpRight size={12} />
                3.2%
              </span>
            </section>
          </div>

          <div className="admin-growth-chart">
            <div className="growth-y-axis">
              <span>₹20L</span>
              <span>₹15L</span>
              <span>₹10L</span>
              <span>₹5L</span>
              <span>₹0</span>
            </div>

            <div className="growth-chart-plot">
              <svg
                viewBox="0 0 760 260"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="adminGrowthArea"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity="0.52"
                    />

                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 220 L70 210 L140 190 L210 175 L280 166 L350 135 L420 144 L490 105 L560 88 L630 72 L700 44 L760 29 L760 260 L0 260 Z"
                  fill="url(#adminGrowthArea)"
                />

                <polyline
                  points="0,220 70,210 140,190 210,175 280,166 350,135 420,144 490,105 560,88 630,72 700,44 760,29"
                  fill="none"
                  stroke="#9a74ff"
                  strokeWidth="4"
                />

                <polyline
                  points="0,238 70,229 140,214 210,201 280,193 350,174 420,179 490,153 560,139 630,128 700,103 760,88"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                />
              </svg>

              <div className="growth-x-axis">
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
              </div>
            </div>
          </div>

          <footer className="admin-chart-legend">
            <span>
              <i className="mrr" />
              Monthly recurring revenue
            </span>

            <span>
              <i className="subscribers" />
              Paid subscribers
            </span>
          </footer>
        </AdminPanel>

        <AdminPanel
          title="Subscription Distribution"
          description="Current active plan mix"
          action={
            <Link to="/subscriptions">
              View plans
            </Link>
          }
        >
          <div className="subscription-total">
            <div>
              <strong>4,812</strong>
              <span>Active subscriptions</span>
            </div>

            <small>
              <ArrowUpRight size={12} />
              318 this month
            </small>
          </div>

          <div className="subscription-bars">
            {[
              {
                plan: "Free",
                value: 100,
                count: "1,472",
              },
              {
                plan: "Plus",
                value: 66,
                count: "1,122",
              },
              {
                plan: "Pro",
                value: 91,
                count: "1,684",
              },
              {
                plan: "Elite",
                value: 31,
                count: "534",
              },
            ].map((item) => (
              <section key={item.plan}>
                <header>
                  <span>{item.plan}</span>
                  <strong>{item.count}</strong>
                </header>

                <div>
                  <i
                    style={{
                      width: `${item.value}%`,
                    }}
                  />
                </div>
              </section>
            ))}
          </div>

          <div className="subscription-insight">
            <Brain size={17} />

            <div>
              <strong>
                Pro conversion is accelerating
              </strong>

              <p>
                Students using Memory Engine are
                2.4× more likely to upgrade.
              </p>
            </div>
          </div>
        </AdminPanel>
      </section>

      <section className="admin-secondary-grid">
        <AdminPanel
          title="Student Outcomes"
          description="Academic and engagement indicators"
          action={
            <Link to="/learning-analytics">
              Full analytics
            </Link>
          }
        >
          <div className="outcome-score-grid">
            <section>
              <span>
                <Target size={16} />
              </span>

              <div>
                <small>
                  Average accuracy
                </small>
                <strong>74.8%</strong>
              </div>

              <i>+6.2%</i>
            </section>

            <section>
              <span>
                <Clock size={16} />
              </span>

              <div>
                <small>
                  Daily study time
                </small>
                <strong>4h 18m</strong>
              </div>

              <i>+22m</i>
            </section>

            <section>
              <span>
                <UserCheck size={16} />
              </span>

              <div>
                <small>
                  Weekly retention
                </small>
                <strong>71.3%</strong>
              </div>

              <i>+4.7%</i>
            </section>

            <section>
              <span>
                <Zap size={16} />
              </span>

              <div>
                <small>
                  Focus efficiency
                </small>
                <strong>78.1%</strong>
              </div>

              <i>+8.9%</i>
            </section>
          </div>

          <div className="student-risk-summary">
            <header>
              <span>
                Students requiring attention
              </span>

              <strong>184</strong>
            </header>

            <div>
              <span>
                <i className="critical" />
                Critical risk
                <strong>28</strong>
              </span>

              <span>
                <i className="medium" />
                Moderate risk
                <strong>67</strong>
              </span>

              <span>
                <i className="watch" />
                Watch list
                <strong>89</strong>
              </span>
            </div>

            <Link to="/students">
              Review student risks
              <ArrowRight size={13} />
            </Link>
          </div>
        </AdminPanel>

        <AdminPanel
          title="AI Operations"
          description="Usage, quality, cost and safety"
          action={
            <span className="admin-live-label">
              <i />
              Live
            </span>
          }
        >
          <div className="ai-operation-score">
            <div className="ai-score-ring">
              <span>
                <strong>98.7%</strong>
                <small>Availability</small>
              </span>
            </div>

            <div>
              <section>
                <small>Requests today</small>
                <strong>182,604</strong>
              </section>

              <section>
                <small>Average latency</small>
                <strong>1.42s</strong>
              </section>

              <section>
                <small>Evaluation score</small>
                <strong>92.4%</strong>
              </section>
            </div>
          </div>

          <div className="ai-cost-bars">
            {[
              {
                label: "AI Mentor",
                value: 84,
                amount: "₹68,420",
              },
              {
                label: "Behavior AI",
                value: 53,
                amount: "₹37,180",
              },
              {
                label: "Research AI",
                value: 36,
                amount: "₹24,850",
              },
              {
                label: "Predictions",
                value: 22,
                amount: "₹15,440",
              },
            ].map((item) => (
              <section key={item.label}>
                <header>
                  <span>{item.label}</span>
                  <strong>
                    {item.amount}
                  </strong>
                </header>

                <div>
                  <i
                    style={{
                      width: `${item.value}%`,
                    }}
                  />
                </div>
              </section>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="System Health"
          description="Production infrastructure"
          action={
            <Link to="/system-health">
              View systems
            </Link>
          }
        >
          <div className="system-health-list">
            {[
              {
                icon: Server,
                label: "API Services",
                status: "Operational",
                latency: "118 ms",
              },
              {
                icon: Database,
                label: "Primary Database",
                status: "Operational",
                latency: "24 ms",
              },
              {
                icon: Brain,
                label: "AI Services",
                status: "Operational",
                latency: "1.42 s",
              },
              {
                icon: Zap,
                label: "Realtime Gateway",
                status: "Operational",
                latency: "46 ms",
              },
              {
                icon: ShieldCheck,
                label: "Security Services",
                status: "Operational",
                latency: "31 ms",
              },
            ].map((service) => {
              const Icon = service.icon;

              return (
                <section key={service.label}>
                  <span>
                    <Icon size={15} />
                  </span>

                  <div>
                    <strong>
                      {service.label}
                    </strong>

                    <small>
                      {service.latency}
                    </small>
                  </div>

                  <i />

                  <b>{service.status}</b>
                </section>
              );
            })}
          </div>

          <div className="system-uptime">
            <span>
              30-day platform uptime
            </span>

            <strong>99.982%</strong>
          </div>
        </AdminPanel>
      </section>

      <section className="admin-table-grid">
        <AdminPanel
          title="Recent Subscriptions"
          description="Latest paid and trial activity"
          action={
            <Link to="/subscriptions">
              View all
            </Link>
          }
        >
          <div className="admin-data-table">
            <header>
              <span>Customer</span>
              <span>Plan</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Time</span>
            </header>

            {subscriptions.map((item) => (
              <section key={item.customer}>
                <span>
                  <i>
                    {item.customer
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </i>

                  {item.customer}
                </span>

                <span>{item.plan}</span>
                <strong>{item.amount}</strong>

                <span>
                  <b
                    className={
                      item.status === "Trial"
                        ? "trial"
                        : ""
                    }
                  >
                    {item.status}
                  </b>
                </span>

                <small>{item.time}</small>
              </section>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Intervention Outcomes"
          description="Recent personalised interventions"
          action={
            <Link to="/interventions">
              Open centre
            </Link>
          }
        >
          <div className="intervention-list">
            {interventions.map((item) => (
              <section key={item.student}>
                <span>
                  <Zap size={14} />
                </span>

                <div>
                  <strong>{item.student}</strong>
                  <small>{item.reason}</small>
                </div>

                <div>
                  <strong>{item.action}</strong>
                  <small>Intervention</small>
                </div>

                <b>{item.outcome}</b>
              </section>
            ))}
          </div>
        </AdminPanel>
      </section>

      <section className="admin-alert-strip">
        <div>
          <AlertTriangle size={18} />

          <span>
            <strong>
              3 operational items need review
            </strong>

            <small>
              Two failed subscription payments
              and one elevated AI latency event.
            </small>
          </span>
        </div>

        <button type="button">
          Review alerts
          <ArrowRight size={14} />
        </button>
      </section>
    </div>
  );
}
EOF

# ============================================================
# GENERIC ADMIN MODULE PAGE
# ============================================================

cat > apps/admin/src/pages/shared/AdminModulePage.tsx <<'EOF'
import {
  ArrowRight,
  BarChart3,
  Brain,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface AdminModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function AdminModulePage({
  eyebrow,
  title,
  description,
}: AdminModulePageProps) {
  return (
    <div className="admin-module-page">
      <header className="admin-module-hero">
        <div>
          <span>
            <Sparkles size={13} />
            {eyebrow}
          </span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>

        <button type="button">
          Create report
          <ArrowRight size={15} />
        </button>
      </header>

      <section className="admin-module-metrics">
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
            <small>DATA STATUS</small>
            <strong>Fully synchronised</strong>
          </div>
        </article>

        <article>
          <span>
            <Brain size={18} />
          </span>

          <div>
            <small>AI LAYER</small>
            <strong>Connected</strong>
          </div>
        </article>

        <article>
          <span>
            <ShieldCheck size={18} />
          </span>

          <div>
            <small>ACCESS</small>
            <strong>Authorised</strong>
          </div>
        </article>
      </section>

      <section className="admin-module-content">
        <article>
          <header>
            <div>
              <span>WORKSPACE</span>
              <h2>{title} Intelligence</h2>
            </div>

            <button type="button">
              Configure view
            </button>
          </header>

          <div className="admin-module-placeholder">
            <span>
              <Brain size={44} />
            </span>

            <h3>
              {title} foundation is ready
            </h3>

            <p>
              The responsive company
              administration shell, permissions
              boundary and visual workspace are
              prepared. Real API data will be
              connected during this module's
              implementation phase.
            </p>
          </div>
        </article>

        <aside>
          <span>EXECUTIVE SUMMARY</span>

          <h2>
            AIMERS intelligence is connected.
          </h2>

          <p>
            This module will provide aggregate,
            pseudonymised and permission-aware
            insights for authorised company
            operations.
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
# ROUTER
# ============================================================

cat > apps/admin/src/app/router/AdminRouter.tsx <<'EOF'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AdminShell } from "../shell/AdminShell";

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
      </Routes>
    </BrowserRouter>
  );
}
EOF

cat > apps/admin/src/app/App.tsx <<'EOF'
import { AdminRouter } from "./router/AdminRouter";

export function App() {
  return <AdminRouter />;
}
EOF

cat > apps/admin/src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";

import "./styles/index.css";

const root = document.getElementById(
  "root",
);

if (!root) {
  throw new Error(
    "AIMERS admin root element was not found.",
  );
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

cat > apps/admin/src/vite-env.d.ts <<'EOF'
/// <reference types="vite/client" />
EOF

# ============================================================
# GLOBAL STYLES
# ============================================================

cat > apps/admin/src/styles/index.css <<'EOF'
@import "@aimers/design-tokens/tokens.css";
@import "./admin.css";
@import "../pages/overview/admin-overview.css";
EOF

cat > apps/admin/src/styles/admin.css <<'EOF'
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
      circle at 90% 2%,
      rgba(101, 45, 201, 0.15),
      transparent 26%
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

.admin-app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns:
    245px minmax(0, 1fr);
}

.admin-sidebar {
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

.admin-sidebar-brand {
  display: grid;
  grid-template-columns: 39px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 4px 5px 15px;
}

.admin-sidebar-brand > span {
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

.admin-sidebar-brand strong {
  display: block;
  font-size: 14px;
  letter-spacing: 0.14em;
}

.admin-sidebar-brand strong i {
  color: #a56dff;
  font-style: normal;
}

.admin-sidebar-brand small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.admin-sidebar-brand > button {
  display: none;
  width: 31px;
  height: 31px;
  place-items: center;
  border: 0;
  border-radius: 9px;
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.035);
}

.admin-role-card {
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

.admin-role-card > div {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border-radius: 8px;
  color: #c08cff;
  background:
    rgba(139, 92, 246, 0.11);
}

.admin-role-card small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.1em;
}

.admin-role-card strong {
  display: block;
  margin-top: 3px;
  font-size: 9px;
}

.admin-role-card > i {
  border-radius: 999px;
  padding: 3px 6px;
  color: #5be1a1;
  background:
    rgba(34, 197, 94, 0.08);
  font-size: 6px;
  font-style: normal;
}

.admin-sidebar-navigation {
  overflow-y: auto;
  padding-right: 3px;
}

.admin-sidebar-navigation section {
  margin-bottom: 12px;
}

.admin-sidebar-navigation h2 {
  margin: 0 9px 6px;
  color: #515a77;
  font-size: 7px;
  letter-spacing: 0.13em;
}

.admin-sidebar-link {
  position: relative;
  display: grid;
  min-height: 36px;
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

.admin-sidebar-link:hover {
  color: white;
  background:
    rgba(139, 92, 246, 0.055);
}

.admin-sidebar-link.active {
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

.admin-sidebar-link > i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c07aff;
  box-shadow: 0 0 8px #a855f7;
}

.admin-sidebar-profile {
  display: grid;
  grid-template-columns:
    33px 1fr 29px 29px;
  align-items: center;
  gap: 7px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 12px;
  margin-top: 9px;
  padding: 8px;
  background:
    rgba(255, 255, 255, 0.023);
}

.admin-profile-avatar {
  display: grid;
  width: 33px;
  height: 33px;
  place-items: center;
  border-radius: 10px;
  color: #e7dbff;
  background:
    linear-gradient(
      135deg,
      #4f2a89,
      #1e315b
    );
  font-size: 9px;
  font-weight: 800;
}

.admin-sidebar-profile strong {
  display: block;
  font-size: 9px;
}

.admin-sidebar-profile small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.admin-sidebar-profile a,
.admin-sidebar-profile button {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: var(--aimers-text-muted);
  background: rgba(255, 255, 255, 0.03);
}

.admin-sidebar-backdrop {
  display: none;
}

.admin-main-column {
  min-width: 0;
}

.admin-topbar {
  position: sticky;
  z-index: 50;
  top: 0;
  display: grid;
  min-height: 72px;
  grid-template-columns:
    minmax(250px, 0.8fr)
    minmax(300px, 1.15fr)
    auto;
  align-items: center;
  gap: 20px;
  border-bottom: 1px solid
    var(--aimers-border-soft);
  padding: 9px 18px;
  background:
    rgba(3, 6, 17, 0.9);
  backdrop-filter: blur(20px);
}

.admin-topbar-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-topbar-title > button {
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

.admin-topbar-title h1 {
  margin: 0;
  font-size: 15px;
}

.admin-topbar-title p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.admin-global-search {
  display: grid;
  width: min(100%, 510px);
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

.admin-global-search kbd {
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

.admin-topbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
}

.environment-selector {
  display: flex;
  min-height: 37px;
  align-items: center;
  gap: 7px;
  border: 1px solid
    rgba(34, 197, 94, 0.16);
  border-radius: 9px;
  padding: 0 10px;
  color: #83dbab;
  background:
    rgba(34, 197, 94, 0.04);
  font-size: 8px;
}

.environment-selector > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #49dd91;
  box-shadow: 0 0 8px #22c55e;
}

.admin-topbar-icon {
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

.admin-topbar-icon > span {
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

.admin-account-button {
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

.admin-account-button > span {
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

.admin-account-button strong {
  display: block;
  font-size: 8px;
}

.admin-account-button small {
  display: block;
  margin-top: 2px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.admin-page-content {
  min-height:
    calc(100vh - 110px);
  padding: 15px;
}

.admin-system-footer {
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

.admin-system-footer span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.admin-system-footer
  span:first-child {
  color: #54d89b;
}

.admin-module-page {
  display: grid;
  gap: 13px;
}

.admin-module-hero {
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
      circle at 84% 20%,
      rgba(139, 64, 224, 0.2),
      transparent 35%
    ),
    var(--aimers-surface-1);
}

.admin-module-hero > div > span {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #ac89da;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.admin-module-hero h1 {
  margin: 12px 0 8px;
  font-size:
    clamp(35px, 5vw, 62px);
  letter-spacing: -0.06em;
}

.admin-module-hero p {
  max-width: 720px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.6;
}

.admin-module-hero button,
.admin-module-content button {
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

.admin-module-metrics {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.admin-module-metrics article {
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

.admin-module-metrics article > span {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  color: #c087ff;
  background:
    rgba(139, 92, 246, 0.1);
}

.admin-module-metrics small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 7px;
  letter-spacing: 0.11em;
}

.admin-module-metrics strong {
  display: block;
  margin-top: 4px;
  font-size: 11px;
}

.admin-module-content {
  display: grid;
  grid-template-columns:
    minmax(0, 1.5fr)
    minmax(280px, 0.5fr);
  gap: 12px;
}

.admin-module-content > article,
.admin-module-content > aside {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 18px;
  background: var(--aimers-surface-1);
}

.admin-module-content > article {
  min-height: 430px;
  padding: 20px;
}

.admin-module-content
  > article
  > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.admin-module-content
  > article
  > header span,
.admin-module-content > aside > span {
  color: #a486d3;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.admin-module-content h2 {
  margin: 7px 0 0;
  font-size: 19px;
}

.admin-module-content
  > article
  > header button {
  background:
    rgba(139, 92, 246, 0.1);
}

.admin-module-placeholder {
  display: grid;
  min-height: 335px;
  place-content: center;
  justify-items: center;
  text-align: center;
}

.admin-module-placeholder > span {
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

.admin-module-placeholder h3 {
  margin: 18px 0 8px;
}

.admin-module-placeholder p {
  max-width: 500px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.admin-module-content > aside {
  padding: 22px;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(221, 62, 203, 0.13),
      transparent 33%
    ),
    var(--aimers-surface-1);
}

.admin-module-content > aside p {
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.admin-module-content > aside button {
  margin-top: 17px;
}

@media (max-width: 1180px) {
  .admin-app-shell {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    position: fixed;
    left: 0;
    width: min(245px, calc(100vw - 44px));
    transform: translateX(-105%);
    transition:
      transform var(--aimers-transition);
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }

  .admin-sidebar-backdrop {
    position: fixed;
    z-index: 65;
    inset: 0;
    display: block;
    border: 0;
    opacity: 0;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
  }

  .admin-sidebar-backdrop.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .admin-sidebar-brand > button,
  .admin-topbar-title > button {
    display: grid;
  }
}

@media (max-width: 900px) {
  .admin-topbar {
    grid-template-columns: 1fr auto;
  }

  .admin-global-search {
    display: none;
  }

  .environment-selector {
    display: none;
  }

  .admin-account-button div,
  .admin-account-button > svg {
    display: none;
  }

  .admin-account-button {
    grid-template-columns: 31px;
  }

  .admin-module-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .admin-topbar {
    padding: 8px 10px;
  }

  .admin-topbar-title p {
    display: none;
  }

  .admin-topbar-title h1 {
    font-size: 13px;
  }

  .admin-topbar-icon:first-of-type {
    display: none;
  }

  .admin-page-content {
    padding: 9px;
  }

  .admin-system-footer
    span:nth-child(2) {
    display: none;
  }

  .admin-module-hero {
    min-height: 250px;
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .admin-module-metrics {
    grid-template-columns: 1fr 1fr;
  }
}
EOF

# ============================================================
# DASHBOARD STYLES
# ============================================================

cat > apps/admin/src/pages/overview/admin-overview.css <<'EOF'
.admin-overview-page {
  display: grid;
  gap: 11px;
}

.admin-overview-heading {
  display: flex;
  min-height: 96px;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 16px;
  padding: 16px 18px;
  background:
    radial-gradient(
      circle at 88% 25%,
      rgba(144, 56, 211, 0.13),
      transparent 32%
    ),
    var(--aimers-surface-1);
}

.admin-overview-heading
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

.admin-overview-heading h1 {
  margin: 7px 0 4px;
  font-size: 22px;
  letter-spacing: -0.03em;
}

.admin-overview-heading p {
  margin: 0;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.admin-overview-heading
  > div:last-child {
  display: flex;
  gap: 8px;
}

.admin-overview-heading button {
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
}

.admin-overview-heading
  button:last-child {
  color: white;
  background: var(--aimers-gradient-primary);
}

.admin-metric-grid {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(0, 1fr));
  gap: 9px;
}

.admin-metric-card,
.admin-panel,
.admin-alert-strip {
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

.admin-metric-card {
  min-height: 139px;
  border-radius: 14px;
  padding: 13px;
}

.admin-metric-card header {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 7px;
}

.admin-metric-card
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

.admin-metric-card header small {
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.1em;
}

.admin-metric-card header button {
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

.admin-metric-card > strong {
  display: block;
  margin-top: 15px;
  color: white;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.04em;
}

.admin-metric-card > p {
  margin: 3px 0 10px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.admin-metric-card footer {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 7px;
}

.admin-metric-card
  footer.positive {
  color: #4ed997;
}

.admin-metric-card
  footer.negative {
  color: #fb7185;
}

.admin-tone-violet {
  color: #a47bff;
}

.admin-tone-blue {
  color: #538bff;
}

.admin-tone-cyan {
  color: #3cd8e9;
}

.admin-tone-pink {
  color: #ed68bc;
}

.admin-tone-green {
  color: #4cdb96;
}

.admin-primary-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.55fr)
    minmax(310px, 0.45fr);
  gap: 10px;
}

.admin-secondary-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.admin-table-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.35fr)
    minmax(350px, 0.65fr);
  gap: 10px;
}

.admin-panel {
  min-width: 0;
  border-radius: 15px;
  padding: 14px;
}

.admin-panel-heading {
  display: flex;
  min-height: 35px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
}

.admin-panel-heading h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
}

.admin-panel-heading p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.admin-panel-heading a {
  color: #a895d3;
  font-size: 7px;
  text-decoration: none;
}

.admin-panel-filter {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 7px;
  padding: 4px 7px;
  color: var(--aimers-text-secondary);
  background:
    rgba(255, 255, 255, 0.025);
  font-size: 7px;
}

.growth-panel {
  min-height: 390px;
}

.growth-chart-summary {
  display: flex;
  gap: 32px;
  border-bottom: 1px solid
    var(--aimers-border-soft);
  margin-top: 6px;
  padding: 10px 0 13px;
}

.growth-chart-summary section {
  display: grid;
  gap: 4px;
}

.growth-chart-summary small {
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.growth-chart-summary strong {
  font-size: 16px;
  font-weight: 500;
}

.growth-chart-summary span {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #54db9b;
  font-size: 7px;
}

.admin-growth-chart {
  display: grid;
  height: 235px;
  grid-template-columns: 29px 1fr;
  gap: 5px;
  margin-top: 12px;
}

.growth-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 19px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.growth-chart-plot {
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

.growth-chart-plot svg {
  width: 100%;
  height: 205px;
}

.growth-x-axis {
  display: flex;
  justify-content: space-between;
  padding-top: 5px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.admin-chart-legend {
  display: flex;
  gap: 14px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.admin-chart-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.admin-chart-legend i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.admin-chart-legend .mrr {
  background: #8b5cf6;
}

.admin-chart-legend
  .subscribers {
  background: #22d3ee;
}

.subscription-total {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: 1px solid
    var(--aimers-border-soft);
  margin-top: 11px;
  padding-bottom: 13px;
}

.subscription-total strong {
  display: block;
  font-size: 26px;
  font-weight: 500;
}

.subscription-total span {
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.subscription-total small {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #51da99;
  font-size: 7px;
}

.subscription-bars,
.ai-cost-bars {
  display: grid;
  gap: 11px;
  margin-top: 15px;
}

.subscription-bars section header,
.ai-cost-bars section header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  color: var(--aimers-text-secondary);
  font-size: 7px;
}

.subscription-bars
  section
  header strong,
.ai-cost-bars
  section
  header strong {
  font-weight: 500;
}

.subscription-bars section > div,
.ai-cost-bars section > div {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background:
    rgba(104, 114, 153, 0.13);
}

.subscription-bars
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
      #bd65f2
    );
}

.subscription-bars
  section:nth-child(2)
  > div
  > i {
  background:
    linear-gradient(
      90deg,
      #2563eb,
      #22d3ee
    );
}

.subscription-bars
  section:nth-child(3)
  > div
  > i {
  background:
    linear-gradient(
      90deg,
      #8b5cf6,
      #ec4899
    );
}

.subscription-bars
  section:nth-child(4)
  > div
  > i {
  background:
    linear-gradient(
      90deg,
      #d97706,
      #f59e0b
    );
}

.subscription-insight {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  border: 1px solid
    rgba(132, 83, 228, 0.15);
  border-radius: 9px;
  margin-top: 17px;
  padding: 9px;
  color: #bd83ff;
  background:
    rgba(139, 92, 246, 0.045);
}

.subscription-insight strong {
  color: white;
  font-size: 8px;
}

.subscription-insight p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.5;
}

.admin-secondary-grid
  > .admin-panel {
  min-height: 323px;
}

.outcome-score-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 7px;
  margin-top: 11px;
}

.outcome-score-grid section {
  display: grid;
  min-height: 67px;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 7px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 9px;
  padding: 8px;
  background:
    rgba(255, 255, 255, 0.017);
}

.outcome-score-grid
  section
  > span {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border-radius: 8px;
  color: #a57cff;
  background:
    rgba(139, 92, 246, 0.1);
}

.outcome-score-grid small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.outcome-score-grid strong {
  display: block;
  margin-top: 4px;
  font-size: 11px;
}

.outcome-score-grid
  section
  > i {
  color: #52db9a;
  font-size: 6px;
  font-style: normal;
}

.student-risk-summary {
  border-top: 1px solid
    var(--aimers-border-soft);
  margin-top: 13px;
  padding-top: 12px;
}

.student-risk-summary > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 8px;
}

.student-risk-summary
  > header strong {
  color: #ff7088;
}

.student-risk-summary > div {
  display: grid;
  gap: 5px;
  margin-top: 9px;
}

.student-risk-summary
  > div
  > span {
  display: grid;
  grid-template-columns: 9px 1fr auto;
  align-items: center;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.student-risk-summary i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.student-risk-summary
  .critical {
  background: #ef476f;
}

.student-risk-summary .medium {
  background: #f59e0b;
}

.student-risk-summary .watch {
  background: #3b82f6;
}

.student-risk-summary
  > div strong {
  color: var(--aimers-text-secondary);
}

.student-risk-summary > a {
  display: flex;
  min-height: 27px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 7px;
  margin-top: 9px;
  color: #a795d0;
  background:
    rgba(139, 92, 246, 0.04);
  font-size: 7px;
  text-decoration: none;
}

.admin-live-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #51db99;
  font-size: 7px;
}

.admin-live-label i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.ai-operation-score {
  display: grid;
  grid-template-columns: 105px 1fr;
  align-items: center;
  gap: 13px;
  margin-top: 12px;
}

.ai-score-ring {
  display: grid;
  width: 94px;
  height: 94px;
  place-items: center;
  border-radius: 50%;
  background:
    conic-gradient(
      #7c3aed 0deg,
      #22d3ee 355deg,
      rgba(69, 78, 112, 0.2)
        355deg
    );
}

.ai-score-ring::before {
  position: absolute;
  width: 75px;
  height: 75px;
  border-radius: 50%;
  background: #0a0f21;
  content: "";
}

.ai-score-ring {
  position: relative;
}

.ai-score-ring > span {
  position: relative;
  z-index: 1;
  text-align: center;
}

.ai-score-ring strong {
  display: block;
  font-size: 14px;
}

.ai-score-ring small {
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.ai-operation-score > div:last-child {
  display: grid;
  gap: 8px;
}

.ai-operation-score section {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
  padding-bottom: 6px;
}

.ai-operation-score small {
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.ai-operation-score strong {
  font-size: 8px;
}

.ai-cost-bars {
  margin-top: 13px;
}

.ai-cost-bars
  section
  > div
  > i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background:
    linear-gradient(
      90deg,
      #2563eb,
      #8b5cf6,
      #ec4899
    );
}

.system-health-list {
  display: grid;
  gap: 5px;
  margin-top: 11px;
}

.system-health-list section {
  display: grid;
  min-height: 39px;
  grid-template-columns:
    27px 1fr 7px auto;
  align-items: center;
  gap: 7px;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
}

.system-health-list
  section
  > span {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 8px;
  color: #a47bff;
  background:
    rgba(139, 92, 246, 0.08);
}

.system-health-list strong {
  display: block;
  font-size: 8px;
}

.system-health-list small {
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.system-health-list
  section
  > i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4edd95;
  box-shadow: 0 0 8px #22c55e;
}

.system-health-list b {
  color: #59d99d;
  font-size: 6px;
  font-weight: 500;
}

.system-uptime {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid
    rgba(34, 197, 94, 0.12);
  border-radius: 8px;
  margin-top: 11px;
  padding: 9px;
  color: var(--aimers-text-muted);
  background:
    rgba(34, 197, 94, 0.035);
  font-size: 7px;
}

.system-uptime strong {
  color: #56db9c;
  font-size: 10px;
}

.admin-table-grid
  > .admin-panel {
  min-height: 287px;
}

.admin-data-table {
  margin-top: 10px;
}

.admin-data-table > header,
.admin-data-table > section {
  display: grid;
  min-height: 41px;
  grid-template-columns:
    1.4fr 1fr 0.6fr 0.65fr 0.7fr;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
  font-size: 7px;
}

.admin-data-table > header {
  min-height: 29px;
  color: var(--aimers-text-muted);
  font-size: 6px;
  letter-spacing: 0.08em;
}

.admin-data-table
  > section
  > span:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
  color: white;
}

.admin-data-table
  > section
  > span
  > i {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 8px;
  background:
    linear-gradient(
      135deg,
      #543085,
      #263c68
    );
  font-size: 6px;
  font-style: normal;
}

.admin-data-table
  > section
  > span {
  color: var(--aimers-text-secondary);
}

.admin-data-table
  > section
  > strong {
  font-size: 8px;
}

.admin-data-table
  > section b {
  border-radius: 999px;
  padding: 3px 6px;
  color: #51db99;
  background:
    rgba(34, 197, 94, 0.07);
  font-size: 6px;
  font-weight: 500;
}

.admin-data-table
  > section b.trial {
  color: #62a1ff;
  background:
    rgba(59, 130, 246, 0.08);
}

.admin-data-table
  > section small {
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.intervention-list {
  display: grid;
  gap: 6px;
  margin-top: 11px;
}

.intervention-list section {
  display: grid;
  min-height: 54px;
  grid-template-columns:
    29px 1fr 1.15fr auto;
  align-items: center;
  gap: 8px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 9px;
  padding: 7px;
  background:
    rgba(255, 255, 255, 0.016);
}

.intervention-list
  section
  > span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  color: #bd82ff;
  background:
    rgba(139, 92, 246, 0.09);
}

.intervention-list strong {
  display: block;
  font-size: 7px;
}

.intervention-list small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.intervention-list b {
  color: #52dc9a;
  font-size: 7px;
  font-weight: 500;
}

.admin-alert-strip {
  display: flex;
  min-height: 61px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-color:
    rgba(245, 158, 11, 0.16);
  border-radius: 14px;
  padding: 11px 14px;
  background:
    linear-gradient(
      90deg,
      rgba(112, 72, 12, 0.12),
      rgba(13, 16, 33, 0.94)
    );
}

.admin-alert-strip > div {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #f3ad42;
}

.admin-alert-strip strong {
  display: block;
  color: white;
  font-size: 9px;
}

.admin-alert-strip small {
  display: block;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.admin-alert-strip button {
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 6px;
  border: 1px solid
    rgba(245, 158, 11, 0.18);
  border-radius: 8px;
  padding: 0 10px;
  color: #ffc16a;
  background:
    rgba(245, 158, 11, 0.055);
  font-size: 7px;
}

@media (max-width: 1450px) {
  .admin-metric-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .admin-secondary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .admin-secondary-grid
    > .admin-panel:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1100px) {
  .admin-primary-grid,
  .admin-table-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .admin-overview-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-overview-heading
    > div:last-child {
    width: 100%;
  }

  .admin-overview-heading button {
    flex: 1;
    justify-content: center;
  }

  .admin-metric-grid,
  .admin-secondary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .admin-secondary-grid
    > .admin-panel:last-child {
    grid-column: auto;
  }

  .admin-data-table {
    overflow-x: auto;
  }

  .admin-data-table > header,
  .admin-data-table > section {
    min-width: 610px;
  }
}

@media (max-width: 520px) {
  .admin-metric-grid,
  .admin-secondary-grid {
    grid-template-columns: 1fr;
  }

  .growth-chart-summary {
    gap: 16px;
    overflow-x: auto;
  }

  .outcome-score-grid {
    grid-template-columns: 1fr;
  }

  .intervention-list section {
    grid-template-columns:
      29px 1fr auto;
  }

  .intervention-list
    section
    > div:nth-child(3) {
    display: none;
  }

  .admin-alert-strip {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-alert-strip button {
    width: 100%;
    justify-content: center;
  }
}
EOF

echo "AIMERS OS admin dashboard source created."
