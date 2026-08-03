#!/usr/bin/env bash

set -euo pipefail

echo "Building AIMERS OS V2 student design system..."

# ============================================================
# ROOT CONFIGURATION
# ============================================================

cat > package.json <<'EOF'
{
  "name": "aimers-os-v2",
  "version": "2.0.0",
  "private": true,
  "description": "AIMERS OS subscription-based AI learning operating system",
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "pnpm --filter @aimers/web dev",
    "build": "turbo build",
    "build:web": "pnpm --filter @aimers/web build",
    "typecheck": "turbo typecheck",
    "lint": "turbo lint",
    "test": "turbo test",
    "format": "prettier --write ."
  },
  "engines": {
    "node": ">=22"
  },
  "packageManager": "pnpm@10.14.0"
}
EOF

# ============================================================
# DESIGN TOKENS PACKAGE
# ============================================================

cat > packages/design-tokens/package.json <<'EOF'
{
  "name": "@aimers/design-tokens",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./src/tokens.css"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
EOF

cat > packages/design-tokens/src/index.ts <<'EOF'
export const AIMERS_THEME_NAME = "AIMERS Neon Intelligence";
EOF

cat > packages/design-tokens/src/tokens.css <<'EOF'
:root {
  color-scheme: dark;

  --aimers-bg-primary: #030510;
  --aimers-bg-secondary: #060916;
  --aimers-bg-tertiary: #090d1c;

  --aimers-surface-1: rgba(8, 12, 28, 0.9);
  --aimers-surface-2: rgba(11, 16, 35, 0.92);
  --aimers-surface-3: rgba(16, 22, 46, 0.88);
  --aimers-surface-soft: rgba(255, 255, 255, 0.025);

  --aimers-primary: #8b5cf6;
  --aimers-primary-bright: #a855f7;
  --aimers-primary-deep: #5b21b6;

  --aimers-secondary: #2563eb;
  --aimers-secondary-bright: #22d3ee;

  --aimers-accent: #ec4899;
  --aimers-accent-bright: #f472b6;

  --aimers-success: #22c55e;
  --aimers-success-bright: #5ee6a0;

  --aimers-information: #3b82f6;
  --aimers-warning: #f59e0b;
  --aimers-danger: #ef476f;

  --aimers-text-primary: #f8f9ff;
  --aimers-text-secondary: #aeb5cd;
  --aimers-text-muted: #6f7895;
  --aimers-text-faint: #4c5570;

  --aimers-border-soft: rgba(145, 157, 255, 0.11);
  --aimers-border: rgba(145, 157, 255, 0.18);
  --aimers-border-strong: rgba(157, 121, 255, 0.34);

  --aimers-gradient-primary:
    linear-gradient(
      135deg,
      #5b21b6 0%,
      #8b5cf6 45%,
      #d946ef 100%
    );

  --aimers-gradient-electric:
    linear-gradient(
      135deg,
      #2563eb 0%,
      #7c3aed 52%,
      #ec4899 100%
    );

  --aimers-gradient-cyan:
    linear-gradient(
      135deg,
      #0ea5e9,
      #22d3ee
    );

  --aimers-gradient-success:
    linear-gradient(
      135deg,
      #16a34a,
      #22c55e,
      #14b8a6
    );

  --aimers-gradient-warning:
    linear-gradient(
      135deg,
      #d97706,
      #f59e0b
    );

  --aimers-gradient-danger:
    linear-gradient(
      135deg,
      #e11d48,
      #fb7185
    );

  --aimers-radius-xs: 8px;
  --aimers-radius-sm: 12px;
  --aimers-radius-md: 16px;
  --aimers-radius-lg: 22px;
  --aimers-radius-xl: 28px;
  --aimers-radius-pill: 999px;

  --aimers-shadow-panel:
    0 20px 60px rgba(0, 0, 0, 0.28);

  --aimers-shadow-primary:
    0 0 34px rgba(139, 92, 246, 0.23);

  --aimers-shadow-blue:
    0 0 34px rgba(37, 99, 235, 0.2);

  --aimers-shadow-pink:
    0 0 34px rgba(236, 72, 153, 0.18);

  --aimers-sidebar-width: 230px;
  --aimers-topbar-height: 74px;

  --aimers-transition-fast: 150ms ease;
  --aimers-transition: 240ms ease;
  --aimers-transition-slow: 420ms ease;
}
EOF

# ============================================================
# WEB PACKAGE
# ============================================================

cat > apps/web/package.json <<'EOF'
{
  "name": "@aimers/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "AIMERS OS student subscription application",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  }
}
EOF

cat > apps/web/tsconfig.json <<'EOF'
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

cat > apps/web/vite.config.ts <<'EOF'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
  },
});
EOF

cat > apps/web/index.html <<'EOF'
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

    <title>AIMERS OS</title>
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

mkdir -p \
  apps/web/src/data \
  apps/web/src/components/navigation \
  apps/web/src/components/layout \
  apps/web/src/components/dashboard \
  apps/web/src/pages/shared

# ============================================================
# NAVIGATION DATA
# ============================================================

cat > apps/web/src/data/navigation.ts <<'EOF'
import type { LucideIcon } from "lucide-react";

import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  CalendarDays,
  FileQuestion,
  Home,
  Layers3,
  Library,
  Monitor,
  NotebookPen,
  Search,
  Settings,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const primaryNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "AI Mentor",
    path: "/ai-mentor",
    icon: Bot,
  },
  {
    label: "Behavior AI",
    path: "/behavior-ai",
    icon: Activity,
  },
  {
    label: "Digital Activity",
    path: "/digital-activity",
    icon: Monitor,
  },
  {
    label: "Planner",
    path: "/planner",
    icon: CalendarDays,
  },
  {
    label: "Subjects",
    path: "/subjects",
    icon: BookOpen,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Prediction",
    path: "/prediction",
    icon: TrendingUp,
  },
  {
    label: "Memory Engine",
    path: "/memory-engine",
    icon: Brain,
  },
  {
    label: "Question Bank",
    path: "/question-bank",
    icon: Library,
  },
  {
    label: "Mock Tests",
    path: "/mock-tests",
    icon: FileQuestion,
  },
  {
    label: "Flashcards",
    path: "/flashcards",
    icon: Layers3,
  },
  {
    label: "Notes",
    path: "/notes",
    icon: NotebookPen,
  },
  {
    label: "Research AI",
    path: "/research-ai",
    icon: Search,
  },
  {
    label: "Community",
    path: "/community",
    icon: Users,
  },
  {
    label: "Achievements",
    path: "/achievements",
    icon: Trophy,
  },
];

export const secondaryNavigation: NavigationItem[] = [
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export const allNavigation = [
  ...primaryNavigation,
  ...secondaryNavigation,
];
EOF

# ============================================================
# SIDEBAR
# ============================================================

cat > apps/web/src/components/navigation/Sidebar.tsx <<'EOF'
import {
  Bell,
  Brain,
  Power,
  Settings,
  X,
} from "lucide-react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  primaryNavigation,
  secondaryNavigation,
} from "../../data/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const location = useLocation();

  return (
    <>
      <button
        className={
          isOpen
            ? "sidebar-backdrop visible"
            : "sidebar-backdrop"
        }
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          isOpen
            ? "aimers-sidebar open"
            : "aimers-sidebar"
        }
      >
        <header className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <Brain size={27} />
          </div>

          <div>
            <strong>
              AIMERS <span>OS</span>
            </strong>

            <small>
              Your AI Education OS
            </small>
          </div>

          <button
            className="sidebar-close-button"
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <nav className="sidebar-navigation">
          {primaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
                onClick={onClose}
              >
                <Icon size={17} />

                <span>{item.label}</span>

                {location.pathname ===
                  item.path && (
                  <i />
                )}
              </NavLink>
            );
          })}

          <div className="sidebar-divider" />

          {secondaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
                onClick={onClose}
              >
                <Icon size={17} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <section className="sidebar-pro-card">
          <span>AIMERS PRO</span>

          <strong>
            Unlock your full potential
          </strong>

          <p>
            Advanced AI, analytics and
            unlimited learning intelligence.
          </p>

          <NavLink to="/subscription">
            Upgrade now
          </NavLink>
        </section>

        <footer className="sidebar-profile">
          <div className="profile-row">
            <div className="profile-avatar">
              RN
            </div>

            <div>
              <strong>Ram N.</strong>
              <small>
                NEET 2027 Aspirant
              </small>
            </div>

            <span>PRO</span>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>

            <NavLink
              to="/settings"
              aria-label="Settings"
            >
              <Settings size={16} />
            </NavLink>

            <button
              type="button"
              aria-label="Log out"
            >
              <Power size={16} />
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
EOF

# ============================================================
# TOPBAR
# ============================================================

cat > apps/web/src/components/navigation/Topbar.tsx <<'EOF'
import {
  Bell,
  Bot,
  CalendarDays,
  Command,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { allNavigation } from "../../data/navigation";

interface TopbarProps {
  onOpenSidebar: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 17) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

export function Topbar({
  onOpenSidebar,
}: TopbarProps) {
  const navigate = useNavigate();

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const [query, setQuery] =
    useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [focusMode, setFocusMode] =
    useState(false);

  useEffect(() => {
    function handleKeyboard(
      event: KeyboardEvent,
    ) {
      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);

        window.setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard,
      );
    };
  }, []);

  const results = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return allNavigation.slice(0, 6);
    }

    return allNavigation.filter(
      (item) =>
        item.label
          .toLowerCase()
          .includes(normalized),
    );
  }, [query]);

  function openResult(path: string) {
    navigate(path);
    setQuery("");
    setSearchOpen(false);
  }

  return (
    <>
      <header className="aimers-topbar">
        <div className="topbar-greeting">
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Open navigation"
            onClick={onOpenSidebar}
          >
            <Menu size={21} />
          </button>

          <div>
            <h1>
              {getGreeting()}, Ram{" "}
              <span>👋</span>
            </h1>

            <p>
              “Discipline today, Doctor
              tomorrow.”
            </p>
          </div>
        </div>

        <button
          className="topbar-search"
          type="button"
          onClick={() => {
            setSearchOpen(true);

            window.setTimeout(() => {
              searchInputRef.current?.focus();
            }, 0);
          }}
        >
          <Search size={17} />

          <span>Search anything...</span>

          <kbd>
            <Command size={12} /> K
          </kbd>
        </button>

        <div className="topbar-actions">
          <button
            className={
              focusMode
                ? "focus-toggle active"
                : "focus-toggle"
            }
            type="button"
            onClick={() =>
              setFocusMode(
                (current) => !current,
              )
            }
          >
            <ShieldCheck size={16} />

            <span>Focus Mode</span>

            <i>
              <b />
            </i>
          </button>

          <button
            className="topbar-icon-button"
            type="button"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span>2</span>
          </button>

          <button
            className="topbar-icon-button"
            type="button"
            aria-label="Calendar"
            onClick={() =>
              navigate("/calendar")
            }
          >
            <CalendarDays size={18} />
          </button>

          <button
            className="ask-aimers-button"
            type="button"
            onClick={() =>
              navigate("/ai-mentor")
            }
          >
            <Bot size={18} />

            <span>Ask AIMERS</span>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div
          className="command-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSearchOpen(false);
            }
          }}
        >
          <section
            className="command-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search AIMERS OS"
          >
            <header>
              <Search size={19} />

              <input
                ref={searchInputRef}
                value={query}
                placeholder="Search AIMERS OS..."
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
              />

              <kbd>ESC</kbd>
            </header>

            <div className="command-results">
              <p>Navigate to</p>

              {results.length === 0 ? (
                <div className="command-empty">
                  No modules found.
                </div>
              ) : (
                results.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() =>
                        openResult(
                          item.path,
                        )
                      }
                    >
                      <Icon size={17} />
                      <span>
                        {item.label}
                      </span>
                      <small>Open</small>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
EOF

# ============================================================
# APP SHELL
# ============================================================

cat > apps/web/src/app/shell/AppShell.tsx <<'EOF'
import {
  MessageSquareText,
  Radio,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import { Sidebar } from "../../components/navigation/Sidebar";
import { Topbar } from "../../components/navigation/Topbar";

export function AppShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="aimers-app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="aimers-main-column">
        <Topbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="aimers-page-content">
          <Outlet />
        </main>

        <footer className="aimers-system-footer">
          <div>
            <span />
            System Status
            <strong>
              All Systems Operational
            </strong>
          </div>

          <blockquote>
            “The expert in anything was once a
            beginner.”
          </blockquote>

          <nav>
            <button type="button">
              <MessageSquareText size={13} />
              Feedback
            </button>

            <button type="button">
              <Radio size={13} />
              Support
            </button>

            <span>v2.0.0</span>
          </nav>
        </footer>
      </div>
    </div>
  );
}
EOF

# ============================================================
# DASHBOARD PAGE
# ============================================================

cat > apps/web/src/pages/dashboard/DashboardPage.tsx <<'EOF'
import {
  Activity,
  AppWindow,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  Brain,
  Check,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  Flame,
  Globe2,
  Headphones,
  Library,
  Mic2,
  Play,
  Radio,
  Sparkles,
  Target,
  TrendingUp,
  Youtube,
  Zap,
} from "lucide-react";

import type {
  CSSProperties,
  ReactNode,
} from "react";

import { Link } from "react-router-dom";

import "./dashboard.css";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  change: string;
  icon: ReactNode;
  tone: "orange" | "blue" | "violet" | "pink" | "green";
  points: string;
}

const missions = [
  {
    title: "Physics: Electrostatics",
    detail: "20 Questions",
    completed: true,
  },
  {
    title: "Chemistry: Organic Reactions",
    detail: "25 Questions",
    completed: true,
  },
  {
    title: "Biology: Human Physiology",
    detail: "Read & Notes",
    completed: false,
  },
  {
    title: "Physics: Current Electricity",
    detail: "15 Questions",
    completed: false,
  },
];

const weakTopics = [
  {
    topic: "Electrostatics",
    value: "72% Weak",
    tone: "danger",
  },
  {
    topic: "Organic Reactions",
    value: "65% Weak",
    tone: "danger",
  },
  {
    topic: "Human Physiology",
    value: "58% Weak",
    tone: "warning",
  },
  {
    topic: "Current Electricity",
    value: "47% Weak",
    tone: "success",
  },
];

const quickActions = [
  {
    label: "Start Mock Test",
    icon: Target,
    path: "/mock-tests",
  },
  {
    label: "Flashcards",
    icon: LayersIcon,
    path: "/flashcards",
  },
  {
    label: "AI Doubt Solver",
    icon: Bot,
    path: "/ai-mentor",
  },
  {
    label: "Voice Notes",
    icon: Mic2,
    path: "/notes",
  },
  {
    label: "Memory Review",
    icon: Brain,
    path: "/memory-engine",
  },
  {
    label: "Question Bank",
    icon: Library,
    path: "/question-bank",
  },
  {
    label: "Study Planner",
    icon: Clock3,
    path: "/planner",
  },
  {
    label: "Focus Music",
    icon: Headphones,
    path: "/focus-room",
  },
];

function LayersIcon() {
  return <BookOpenCheck size={16} />;
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  change,
  icon,
  tone,
  points,
}: MetricCardProps) {
  return (
    <article
      className={`metric-card metric-${tone}`}
    >
      <header>
        <div className="metric-icon">
          {icon}
        </div>

        <span>{label}</span>

        <button
          type="button"
          aria-label={`Open ${label}`}
        >
          <ArrowUpRight size={13} />
        </button>
      </header>

      <div className="metric-value">
        <strong>{value}</strong>

        {unit && <span>{unit}</span>}
      </div>

      <p>{detail}</p>

      <svg
        className="metric-sparkline"
        viewBox="0 0 120 28"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

      <small>{change}</small>
    </article>
  );
}

function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`dashboard-panel ${className}`}
    >
      <header className="panel-heading">
        <div>
          {eyebrow && (
            <span>{eyebrow}</span>
          )}

          <h2>{title}</h2>
        </div>

        {action}
      </header>

      {children}
    </article>
  );
}

function ProgressRing({
  value,
  size = 112,
}: {
  value: number;
  size?: number;
}) {
  const style = {
    "--ring-value": `${value * 3.6}deg`,
    width: `${size}px`,
    height: `${size}px`,
  } as CSSProperties;

  return (
    <div
      className="progress-ring"
      style={style}
    >
      <div>
        <strong>{value}%</strong>
        <span>Completed</span>
      </div>
    </div>
  );
}

export function DashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-metrics">
        <MetricCard
          label="Study Streak"
          value="27"
          unit="days"
          detail="Best: 27 days"
          change="↑ 4 days this month"
          icon={<Flame size={17} />}
          tone="orange"
          points="0,23 12,18 24,21 36,14 48,17 60,9 72,14 84,8 96,11 108,3 120,5"
        />

        <MetricCard
          label="AI Score"
          value="85%"
          detail="Cognitive performance"
          change="↑ 12% this week"
          icon={<BarChart3 size={17} />}
          tone="violet"
          points="0,24 12,20 24,22 36,13 48,17 60,8 72,12 84,5 96,8 108,2 120,4"
        />

        <MetricCard
          label="Study Time"
          value="7h 32m"
          detail="Today"
          change="↑ 1h 20m vs yesterday"
          icon={<Clock3 size={17} />}
          tone="blue"
          points="0,25 15,25 15,20 30,20 30,22 45,22 45,11 60,11 60,17 75,17 75,7 90,7 90,14 105,14 105,3 120,3"
        />

        <MetricCard
          label="Questions Solved"
          value="142"
          detail="Today"
          change="↑ 28 vs yesterday"
          icon={<CircleCheckBig size={17} />}
          tone="pink"
          points="0,25 12,24 24,22 36,24 48,16 60,23 72,9 84,20 96,4 108,14 120,8"
        />

        <MetricCard
          label="Accuracy"
          value="78%"
          detail="Good"
          change="↑ 8% vs last 7 days"
          icon={<Target size={17} />}
          tone="green"
          points="0,25 12,22 24,23 36,17 48,20 60,9 72,14 84,4 96,11 108,6 120,8"
        />
      </section>

      <section className="dashboard-hero-grid">
        <div className="dashboard-primary-column">
          <div className="mission-mentor-grid">
            <Panel
              title="Today's Mission"
              className="mission-panel"
              action={
                <span className="panel-count">
                  2/4 Completed
                </span>
              }
            >
              <div className="mission-content">
                <div className="mission-list">
                  {missions.map(
                    (mission) => (
                      <section
                        key={mission.title}
                        className={
                          mission.completed
                            ? "mission-item completed"
                            : "mission-item"
                        }
                      >
                        <span className="mission-state">
                          {mission.completed ? (
                            <Check size={13} />
                          ) : (
                            <Play size={12} />
                          )}
                        </span>

                        <div>
                          <strong>
                            {mission.title}
                          </strong>

                          <small>
                            {mission.detail}
                          </small>
                        </div>

                        <ChevronRight
                          size={15}
                        />
                      </section>
                    ),
                  )}
                </div>

                <ProgressRing value={50} />
              </div>

              <div className="mission-footer">
                <span>
                  <CircleCheckBig
                    size={15}
                  />
                  Keep going! You're doing
                  great.
                </span>

                <Link to="/planner">
                  Continue Mission
                  <ChevronRight size={15} />
                </Link>
              </div>
            </Panel>

            <Panel
              title="AI Mentor"
              eyebrow="Always here to help"
              className="mentor-panel"
              action={
                <Sparkles size={18} />
              }
            >
              <div className="mentor-conversation">
                <div className="mentor-message assistant">
                  <span>
                    <Bot size={15} />
                  </span>

                  <p>
                    Ram, I noticed your
                    Chemistry accuracy is
                    improving. Would you like
                    to revise SN1 and SN2
                    reactions today?
                  </p>
                </div>

                <div className="mentor-message user">
                  Yes, explain in Malayalam
                  please.
                </div>

                <div className="mentor-message assistant compact">
                  <span>
                    <Bot size={15} />
                  </span>

                  <p>
                    ശരി Ram! നമുക്ക്
                    ഘട്ടംഘട്ടമായി പഠിക്കാം.
                  </p>
                </div>
              </div>

              <div className="mentor-input">
                <span>Ask anything...</span>

                <Mic2 size={16} />

                <Link to="/ai-mentor">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </Panel>
          </div>

          <section className="dashboard-analysis-grid">
            <Panel
              title="Study Analytics"
              action={
                <button
                  className="panel-filter"
                  type="button"
                >
                  This Week
                </button>
              }
            >
              <div className="study-chart">
                <div className="chart-y-axis">
                  <span>12h</span>
                  <span>9h</span>
                  <span>6h</span>
                  <span>3h</span>
                  <span>0h</span>
                </div>

                <div className="chart-plot">
                  <svg
                    viewBox="0 0 440 180"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="studyArea"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6d5dfc"
                          stopOpacity="0.55"
                        />

                        <stop
                          offset="100%"
                          stopColor="#6d5dfc"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <path
                      d="M0 150 L65 120 L130 130 L195 75 L260 100 L325 48 L390 72 L440 38 L440 180 L0 180 Z"
                      fill="url(#studyArea)"
                    />

                    <polyline
                      points="0,150 65,120 130,130 195,75 260,100 325,48 390,72 440,38"
                      fill="none"
                      stroke="#7d74ff"
                      strokeWidth="4"
                    />

                    <polyline
                      points="0,165 65,143 130,153 195,125 260,144 325,112 390,133 440,97"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="3"
                    />
                  </svg>

                  <div className="chart-days">
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

              <div className="chart-legend">
                <span>
                  <i className="legend-study" />
                  Study Time
                </span>

                <span>
                  <i className="legend-focus" />
                  Focus Time
                </span>
              </div>
            </Panel>

            <Panel
              title="Subject Wise Progress"
              action={
                <button
                  className="panel-filter"
                  type="button"
                >
                  This Month
                </button>
              }
            >
              <div className="subject-progress">
                <div className="subject-donut">
                  <div>
                    <strong>78%</strong>
                    <span>Overall</span>
                  </div>
                </div>

                <div className="subject-list">
                  <span>
                    <i className="physics" />
                    Physics
                    <strong>82%</strong>
                  </span>

                  <span>
                    <i className="chemistry" />
                    Chemistry
                    <strong>75%</strong>
                  </span>

                  <span>
                    <i className="biology" />
                    Biology
                    <strong>78%</strong>
                  </span>

                  <span>
                    <i className="other" />
                    Others
                    <strong>65%</strong>
                  </span>
                </div>
              </div>
            </Panel>

            <Panel
              title="Weak Topics"
              action={
                <span className="ai-detected">
                  AI Detected
                </span>
              }
            >
              <div className="weak-topic-list">
                {weakTopics.map(
                  (item) => (
                    <section
                      key={item.topic}
                    >
                      <span
                        className={`weak-icon ${item.tone}`}
                      >
                        <Zap size={13} />
                      </span>

                      <strong>
                        {item.topic}
                      </strong>

                      <small
                        className={
                          item.tone
                        }
                      >
                        {item.value}
                      </small>
                    </section>
                  ),
                )}
              </div>

              <Link
                className="panel-full-link"
                to="/analytics"
              >
                View All Weak Topics
              </Link>
            </Panel>

            <Panel
              title="Predicted Performance"
              action={
                <span className="prediction-tag">
                  NEET 2027
                </span>
              }
            >
              <div className="prediction-score">
                <strong>620–650</strong>
                <span>
                  Expected Score Range
                </span>
              </div>

              <div className="prediction-boxes">
                <section>
                  <span>All India Rank</span>
                  <strong>
                    1,250–2,300
                  </strong>
                </section>

                <section>
                  <span>
                    Confidence Level
                  </span>
                  <strong>High · 81%</strong>
                </section>
              </div>

              <Link
                className="panel-full-link"
                to="/prediction"
              >
                View Full Prediction
              </Link>
            </Panel>
          </section>
        </div>

        <aside className="dashboard-secondary-column">
          <Panel
            title="AIMERS Brain"
            eyebrow="Your Cognitive Intelligence Map"
            className="brain-panel"
            action={
              <span className="live-badge">
                <i />
                Live
              </span>
            }
          >
            <div className="brain-map">
              <div className="brain-signals left">
                <span>
                  Memory Engine
                  <strong>82%</strong>
                </span>

                <span>
                  Knowledge Graph
                  <strong>76%</strong>
                </span>

                <span>
                  Reasoning Core
                  <strong>88%</strong>
                </span>

                <span>
                  Language Engine
                  <strong>90%</strong>
                </span>
              </div>

              <div className="brain-visual">
                <div className="brain-orbit orbit-one" />
                <div className="brain-orbit orbit-two" />
                <div className="brain-orbit orbit-three" />

                <Brain size={104} />

                <i className="brain-node node-one" />
                <i className="brain-node node-two" />
                <i className="brain-node node-three" />
                <i className="brain-node node-four" />
              </div>

              <div className="brain-signals right">
                <span>
                  Focus Engine
                  <strong>84%</strong>
                </span>

                <span>
                  Behavior AI
                  <strong>73%</strong>
                </span>

                <span>
                  Prediction AI
                  <strong>81%</strong>
                </span>

                <span>
                  Emotional AI
                  <strong>70%</strong>
                </span>
              </div>
            </div>

            <footer className="brain-status">
              <span>
                <i />
                All systems active
              </span>

              <small>
                Synced just now
              </small>
            </footer>
          </Panel>

          <div className="insights-activity-grid">
            <Panel
              title="AI Insights"
              eyebrow="Personalized for you"
            >
              <div className="insight-card-content">
                <div>
                  <p>
                    You perform best between
                  </p>

                  <strong>
                    6:00 AM – 9:00 AM
                  </strong>

                  <small>
                    Focus is highest in the
                    morning. Schedule important
                    subjects first.
                  </small>
                </div>

                <div className="time-dial">
                  <span>6 AM</span>
                  <Clock3 size={28} />
                  <span>9 AM</span>
                </div>
              </div>
            </Panel>

            <Panel
              title="Digital Activity Monitor"
              eyebrow="With your consent"
              action={
                <span className="active-badge">
                  <i />
                  Active
                </span>
              }
            >
              <div className="activity-list">
                <span>
                  <Globe2 size={14} />
                  Study Websites
                  <strong>2h 15m</strong>
                </span>

                <span>
                  <Youtube size={14} />
                  YouTube (Edu)
                  <strong>1h 05m</strong>
                </span>

                <span>
                  <AppWindow size={14} />
                  Notes Apps
                  <strong>1h 30m</strong>
                </span>

                <span>
                  <BookOpenCheck size={14} />
                  Practice Platforms
                  <strong>1h 20m</strong>
                </span>

                <span>
                  <Activity size={14} />
                  Other Apps
                  <strong>45m</strong>
                </span>
              </div>

              <Link
                className="panel-full-link"
                to="/digital-activity"
              >
                View Detailed Report
              </Link>
            </Panel>
          </div>

          <div className="secondary-lower-grid">
            <Panel
              title="Memory Engine"
              eyebrow="Retention Status"
              className="memory-panel"
            >
              <div className="memory-score">
                <strong>72%</strong>
                <span>Retention Score</span>
              </div>

              <svg
                className="memory-line-chart"
                viewBox="0 0 300 90"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,8 60,24 120,35 180,56 240,72 300,83"
                  fill="none"
                  stroke="#a56dff"
                  strokeWidth="3"
                />

                <circle
                  cx="0"
                  cy="8"
                  r="4"
                  fill="#69d8ff"
                />

                <circle
                  cx="120"
                  cy="35"
                  r="4"
                  fill="#69d8ff"
                />

                <circle
                  cx="180"
                  cy="56"
                  r="4"
                  fill="#ec73ff"
                />

                <circle
                  cx="300"
                  cy="83"
                  r="4"
                  fill="#6dd6ff"
                />
              </svg>

              <div className="memory-axis">
                <span>1D</span>
                <span>3D</span>
                <span>7D</span>
                <span>15D</span>
                <span>30D</span>
              </div>
            </Panel>

            <Panel
              title="AI Voice Assistant"
              eyebrow="Tap to speak"
              className="voice-panel"
            >
              <button
                type="button"
                aria-label="Start voice assistant"
              >
                <Radio size={20} />
                <span>
                  <Mic2 size={28} />
                </span>
              </button>
            </Panel>
          </div>
        </aside>
      </section>

      <section className="quick-actions-panel">
        <header>
          <h2>Quick Actions</h2>
        </header>

        <div>
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.label}
                to={action.path}
              >
                <span>
                  <Icon size={16} />
                </span>

                <strong>
                  {action.label}
                </strong>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
EOF

# ============================================================
# GENERIC MODULE PAGE
# ============================================================

cat > apps/web/src/pages/shared/ModulePage.tsx <<'EOF'
import {
  ArrowUpRight,
  Brain,
  ChartNoAxesCombined,
  CircleCheckBig,
  Sparkles,
} from "lucide-react";

interface ModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function ModulePage({
  eyebrow,
  title,
  description,
}: ModulePageProps) {
  return (
    <div className="module-page">
      <header className="module-hero">
        <div>
          <span>{eyebrow}</span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>

        <button type="button">
          <Sparkles size={17} />
          Open AI Assistant
        </button>
      </header>

      <section className="module-stat-grid">
        <article>
          <span>
            <CircleCheckBig size={17} />
          </span>

          <div>
            <small>STATUS</small>
            <strong>System Ready</strong>
          </div>
        </article>

        <article>
          <span>
            <ChartNoAxesCombined
              size={17}
            />
          </span>

          <div>
            <small>INSIGHTS</small>
            <strong>Live Intelligence</strong>
          </div>
        </article>

        <article>
          <span>
            <Brain size={17} />
          </span>

          <div>
            <small>AI ENGINE</small>
            <strong>Connected</strong>
          </div>
        </article>
      </section>

      <section className="module-content-grid">
        <article className="module-main-panel">
          <header>
            <div>
              <span>WORKSPACE</span>
              <h2>{title} Overview</h2>
            </div>

            <button type="button">
              View Details
              <ArrowUpRight size={15} />
            </button>
          </header>

          <div className="module-empty-visual">
            <div>
              <Brain size={42} />
            </div>

            <h3>
              {title} interface prepared
            </h3>

            <p>
              The responsive page shell and
              visual system are active. Real
              data and module functionality
              will be connected during its
              implementation milestone.
            </p>
          </div>
        </article>

        <aside className="module-side-panel">
          <span>AI SUMMARY</span>

          <h2>
            Your intelligence layer is ready.
          </h2>

          <p>
            AIMERS will analyse this module,
            connect it with your learning
            profile and generate personalised
            actions.
          </p>

          <button type="button">
            Configure Module
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

cat > apps/web/src/app/router/AppRouter.tsx <<'EOF'
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
EOF

cat > apps/web/src/app/App.tsx <<'EOF'
import { AppRouter } from "./router/AppRouter";

export function App() {
  return <AppRouter />;
}
EOF

cat > apps/web/src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";

import "./styles/index.css";

const root = document.getElementById(
  "root",
);

if (!root) {
  throw new Error(
    "AIMERS root element was not found.",
  );
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

cat > apps/web/src/vite-env.d.ts <<'EOF'
/// <reference types="vite/client" />
EOF

# ============================================================
# GLOBAL STYLES
# ============================================================

cat > apps/web/src/styles/index.css <<'EOF'
@import "@aimers/design-tokens/tokens.css";
@import "./reset.css";
@import "./globals.css";
@import "../pages/dashboard/dashboard.css";
EOF

cat > apps/web/src/styles/reset.css <<'EOF'
* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  min-height: 100%;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

button {
  cursor: pointer;
}

img,
svg {
  display: block;
  max-width: 100%;
}
EOF

cat > apps/web/src/styles/globals.css <<'EOF'
html {
  background: var(--aimers-bg-primary);
}

body {
  overflow-x: hidden;
  color: var(--aimers-text-primary);
  background:
    radial-gradient(
      circle at 82% 3%,
      rgba(85, 43, 179, 0.18),
      transparent 27%
    ),
    radial-gradient(
      circle at 45% 32%,
      rgba(26, 78, 181, 0.08),
      transparent 28%
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

body,
button,
input {
  color: var(--aimers-text-primary);
}

button {
  border: 0;
}

a {
  color: inherit;
}

::selection {
  color: white;
  background: rgba(139, 92, 246, 0.56);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: var(--aimers-radius-pill);
  background:
    rgba(129, 138, 180, 0.28);
  background-clip: padding-box;
}

.aimers-app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns:
    var(--aimers-sidebar-width)
    minmax(0, 1fr);
}

.aimers-main-column {
  min-width: 0;
}

.aimers-sidebar {
  position: sticky;
  z-index: 70;
  top: 0;
  display: grid;
  height: 100vh;
  grid-template-rows:
    auto minmax(0, 1fr) auto auto;
  border-right: 1px solid
    var(--aimers-border-soft);
  padding: 14px 13px;
  background:
    linear-gradient(
      180deg,
      rgba(7, 11, 26, 0.98),
      rgba(4, 8, 19, 0.98)
    );
  box-shadow:
    20px 0 55px rgba(0, 0, 0, 0.16);
}

.sidebar-brand {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 5px 4px 18px;
}

.sidebar-brand-mark {
  display: grid;
  width: 39px;
  height: 39px;
  place-items: center;
  border: 1px solid
    rgba(146, 99, 255, 0.35);
  border-radius: 13px;
  color: #d590ff;
  background:
    radial-gradient(
      circle,
      rgba(168, 85, 247, 0.23),
      rgba(68, 37, 144, 0.14)
    );
  box-shadow:
    0 0 24px rgba(139, 92, 246, 0.21);
}

.sidebar-brand strong {
  display: block;
  font-size: 15px;
  letter-spacing: 0.16em;
}

.sidebar-brand strong span {
  color: #a471ff;
}

.sidebar-brand small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.sidebar-close-button {
  display: none;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 9px;
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.04);
}

.sidebar-navigation {
  overflow-y: auto;
  padding-right: 3px;
}

.sidebar-link {
  position: relative;
  display: grid;
  min-height: 38px;
  grid-template-columns: 25px 1fr auto;
  align-items: center;
  gap: 5px;
  border: 1px solid transparent;
  border-radius: 10px;
  margin-bottom: 3px;
  padding: 0 10px;
  color: #bec3d6;
  font-size: 12px;
  text-decoration: none;
  transition:
    color var(--aimers-transition-fast),
    border-color var(--aimers-transition-fast),
    background var(--aimers-transition-fast);
}

.sidebar-link:hover {
  color: white;
  background: rgba(132, 78, 255, 0.07);
}

.sidebar-link.active {
  border-color:
    rgba(139, 92, 246, 0.16);
  color: white;
  background:
    linear-gradient(
      90deg,
      rgba(105, 45, 213, 0.58),
      rgba(99, 49, 188, 0.12)
    );
  box-shadow:
    inset 2px 0 #a45bff,
    0 0 22px rgba(111, 63, 202, 0.1);
}

.sidebar-link.active i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c98aff;
  box-shadow: 0 0 10px #a855f7;
}

.sidebar-divider {
  height: 1px;
  margin: 9px 8px;
  background: var(--aimers-border-soft);
}

.sidebar-pro-card {
  border: 1px solid
    rgba(142, 86, 255, 0.19);
  border-radius: 14px;
  margin-top: 12px;
  padding: 13px;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(220, 55, 177, 0.15),
      transparent 40%
    ),
    rgba(114, 59, 218, 0.08);
}

.sidebar-pro-card > span {
  color: #cf8cff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.sidebar-pro-card strong {
  display: block;
  margin-top: 5px;
  font-size: 11px;
}

.sidebar-pro-card p {
  margin: 6px 0 10px;
  color: var(--aimers-text-muted);
  font-size: 9px;
  line-height: 1.45;
}

.sidebar-pro-card a {
  display: flex;
  min-height: 31px;
  align-items: center;
  justify-content: center;
  border: 1px solid
    rgba(222, 121, 255, 0.27);
  border-radius: 8px;
  background: var(--aimers-gradient-primary);
  box-shadow:
    0 0 20px rgba(172, 55, 222, 0.2);
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}

.sidebar-profile {
  margin-top: 10px;
}

.profile-row {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  align-items: center;
  gap: 9px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 13px;
  padding: 9px;
  background: rgba(255, 255, 255, 0.025);
}

.profile-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid
    rgba(76, 164, 255, 0.35);
  border-radius: 50%;
  color: #d5efff;
  background:
    linear-gradient(
      145deg,
      #124776,
      #1b203d
    );
  font-size: 10px;
  font-weight: 800;
}

.profile-row strong {
  display: block;
  font-size: 10px;
}

.profile-row small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.profile-row > span {
  border: 1px solid
    rgba(171, 102, 255, 0.22);
  border-radius: 999px;
  padding: 3px 6px;
  color: #c598ff;
  background: rgba(133, 77, 222, 0.1);
  font-size: 7px;
}

.profile-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.profile-actions button,
.profile-actions a {
  display: grid;
  height: 32px;
  place-items: center;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 9px;
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.025);
}

.profile-actions button:hover,
.profile-actions a:hover {
  color: white;
  border-color: var(--aimers-border);
}

.sidebar-backdrop {
  display: none;
}

.aimers-topbar {
  position: sticky;
  z-index: 50;
  top: 0;
  display: grid;
  min-height: var(--aimers-topbar-height);
  grid-template-columns:
    minmax(220px, 0.85fr)
    minmax(280px, 1.15fr)
    auto;
  align-items: center;
  gap: 20px;
  border-bottom: 1px solid
    rgba(135, 147, 211, 0.07);
  padding: 10px 20px;
  background:
    linear-gradient(
      180deg,
      rgba(3, 5, 16, 0.97),
      rgba(3, 5, 16, 0.88)
    );
  backdrop-filter: blur(20px);
}

.topbar-greeting {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-greeting h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.topbar-greeting h1 span {
  font-size: 16px;
}

.topbar-greeting p {
  margin: 4px 0 0;
  color: var(--aimers-text-muted);
  font-size: 10px;
}

.mobile-menu-button {
  display: none;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 11px;
  color: var(--aimers-text-secondary);
  background: var(--aimers-surface-soft);
}

.topbar-search {
  display: grid;
  width: min(100%, 500px);
  min-height: 38px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  justify-self: center;
  border: 1px solid
    var(--aimers-border);
  border-radius: 11px;
  padding: 0 12px;
  color: var(--aimers-text-muted);
  background:
    rgba(10, 15, 33, 0.76);
  text-align: left;
}

.topbar-search:hover {
  border-color:
    var(--aimers-border-strong);
}

.topbar-search kbd,
.command-dialog kbd {
  display: flex;
  align-items: center;
  gap: 3px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 6px;
  padding: 3px 6px;
  color: var(--aimers-text-muted);
  background: rgba(255, 255, 255, 0.035);
  font-family: inherit;
  font-size: 8px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.focus-toggle {
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  border: 1px solid
    rgba(194, 92, 255, 0.25);
  border-radius: 11px;
  padding: 0 11px;
  color: #d6b8ef;
  background: rgba(98, 49, 140, 0.08);
  font-size: 9px;
}

.focus-toggle i {
  display: flex;
  width: 29px;
  height: 16px;
  align-items: center;
  border-radius: 999px;
  padding: 2px;
  background: #222944;
}

.focus-toggle i b {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #8289a6;
  transition:
    transform var(--aimers-transition-fast),
    background var(--aimers-transition-fast);
}

.focus-toggle.active i b {
  transform: translateX(13px);
  background: #af72ff;
  box-shadow: 0 0 10px #8b5cf6;
}

.topbar-icon-button {
  position: relative;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 11px;
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.025);
}

.topbar-icon-button > span {
  position: absolute;
  top: -4px;
  right: -3px;
  display: grid;
  width: 15px;
  height: 15px;
  place-items: center;
  border: 2px solid
    var(--aimers-bg-primary);
  border-radius: 50%;
  color: white;
  background: var(--aimers-danger);
  font-size: 7px;
}

.ask-aimers-button {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  border: 1px solid
    rgba(205, 111, 255, 0.34);
  border-radius: 11px;
  padding: 0 16px;
  color: white;
  background: var(--aimers-gradient-primary);
  box-shadow:
    0 0 25px rgba(157, 62, 227, 0.23);
  font-size: 10px;
  font-weight: 700;
}

.aimers-page-content {
  min-height:
    calc(
      100vh -
      var(--aimers-topbar-height) -
      42px
    );
  padding: 14px 16px 18px;
}

.aimers-system-footer {
  display: grid;
  min-height: 42px;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  border-top: 1px solid
    var(--aimers-border-soft);
  padding: 0 18px;
  color: var(--aimers-text-muted);
  background: rgba(3, 6, 16, 0.74);
  font-size: 8px;
}

.aimers-system-footer > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.aimers-system-footer > div > span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #37d88d;
  box-shadow: 0 0 10px #22c55e;
}

.aimers-system-footer strong {
  color: #54d69c;
  font-weight: 500;
}

.aimers-system-footer blockquote {
  margin: 0;
  color: #66708d;
  font-size: 10px;
}

.aimers-system-footer nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}

.aimers-system-footer nav button {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--aimers-text-muted);
  background: transparent;
  font-size: 8px;
}

.command-overlay {
  position: fixed;
  z-index: 120;
  inset: 0;
  display: grid;
  place-items: start center;
  padding: 12vh 18px 20px;
  background: rgba(1, 3, 11, 0.76);
  backdrop-filter: blur(13px);
}

.command-dialog {
  width: min(610px, 100%);
  overflow: hidden;
  border: 1px solid
    rgba(157, 121, 255, 0.34);
  border-radius: 18px;
  background:
    linear-gradient(
      180deg,
      rgba(14, 19, 42, 0.98),
      rgba(6, 9, 24, 0.98)
    );
  box-shadow:
    0 34px 100px rgba(0, 0, 0, 0.58),
    var(--aimers-shadow-primary);
}

.command-dialog > header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 11px;
  border-bottom: 1px solid
    var(--aimers-border-soft);
  padding: 15px;
}

.command-dialog input {
  min-width: 0;
  border: 0;
  outline: 0;
  color: white;
  background: transparent;
}

.command-dialog input::placeholder {
  color: var(--aimers-text-muted);
}

.command-results {
  max-height: 390px;
  overflow-y: auto;
  padding: 10px;
}

.command-results > p {
  margin: 4px 8px 8px;
  color: var(--aimers-text-muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.command-results button {
  display: grid;
  width: 100%;
  min-height: 44px;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  border-radius: 10px;
  padding: 0 11px;
  color: var(--aimers-text-secondary);
  background: transparent;
  text-align: left;
}

.command-results button:hover {
  color: white;
  background: rgba(139, 92, 246, 0.11);
}

.command-results button small {
  color: var(--aimers-text-muted);
}

.command-empty {
  padding: 36px;
  color: var(--aimers-text-muted);
  text-align: center;
}

.module-page {
  display: grid;
  gap: 16px;
}

.module-hero {
  display: flex;
  min-height: 180px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  overflow: hidden;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 22px;
  padding: 28px;
  background:
    radial-gradient(
      circle at 80% 25%,
      rgba(118, 65, 230, 0.2),
      transparent 35%
    ),
    linear-gradient(
      135deg,
      rgba(11, 16, 36, 0.98),
      rgba(7, 10, 25, 0.98)
    );
}

.module-hero span,
.module-main-panel header span,
.module-side-panel > span {
  color: #a890da;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.module-hero h1 {
  margin: 9px 0 7px;
  font-size: clamp(34px, 5vw, 62px);
  letter-spacing: -0.055em;
}

.module-hero p {
  max-width: 680px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.6;
}

.module-hero > button,
.module-main-panel header button,
.module-side-panel button {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  border-radius: 11px;
  padding: 0 15px;
  color: white;
  background: var(--aimers-gradient-primary);
  font-size: 10px;
  font-weight: 700;
}

.module-stat-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.module-stat-grid article {
  display: flex;
  min-height: 92px;
  align-items: center;
  gap: 13px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 16px;
  padding: 16px;
  background: var(--aimers-surface-1);
}

.module-stat-grid article > span {
  display: grid;
  width: 39px;
  height: 39px;
  place-items: center;
  border-radius: 12px;
  color: #ca9eff;
  background: rgba(137, 83, 237, 0.11);
}

.module-stat-grid small {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 8px;
  letter-spacing: 0.12em;
}

.module-stat-grid strong {
  display: block;
  margin-top: 6px;
  font-size: 13px;
}

.module-content-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.5fr)
    minmax(280px, 0.5fr);
  gap: 14px;
}

.module-main-panel,
.module-side-panel {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 20px;
  background: var(--aimers-surface-1);
}

.module-main-panel {
  min-height: 440px;
  padding: 22px;
}

.module-main-panel > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.module-main-panel h2,
.module-side-panel h2 {
  margin: 8px 0 0;
  font-size: 21px;
}

.module-main-panel header button {
  background: rgba(139, 92, 246, 0.1);
}

.module-empty-visual {
  display: grid;
  min-height: 330px;
  place-content: center;
  justify-items: center;
  text-align: center;
}

.module-empty-visual > div {
  display: grid;
  width: 84px;
  height: 84px;
  place-items: center;
  border: 1px solid
    rgba(155, 101, 255, 0.28);
  border-radius: 28px;
  color: #bd83ff;
  background:
    radial-gradient(
      circle,
      rgba(152, 76, 255, 0.2),
      rgba(52, 32, 102, 0.08)
    );
  box-shadow:
    0 0 44px rgba(139, 92, 246, 0.18);
}

.module-empty-visual h3 {
  margin: 20px 0 8px;
  font-size: 17px;
}

.module-empty-visual p {
  max-width: 480px;
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.module-side-panel {
  padding: 24px;
  background:
    radial-gradient(
      circle at 80% 10%,
      rgba(213, 57, 194, 0.14),
      transparent 34%
    ),
    var(--aimers-surface-1);
}

.module-side-panel p {
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.module-side-panel button {
  margin-top: 18px;
}

@media (max-width: 1180px) {
  .aimers-app-shell {
    grid-template-columns: 1fr;
  }

  .aimers-sidebar {
    position: fixed;
    left: 0;
    width: min(
      var(--aimers-sidebar-width),
      calc(100vw - 45px)
    );
    transform: translateX(-105%);
    transition:
      transform var(--aimers-transition);
  }

  .aimers-sidebar.open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    position: fixed;
    z-index: 65;
    inset: 0;
    display: block;
    border: 0;
    opacity: 0;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.64);
    backdrop-filter: blur(6px);
    transition: opacity var(--aimers-transition);
  }

  .sidebar-backdrop.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar-close-button,
  .mobile-menu-button {
    display: grid;
  }

  .aimers-topbar {
    grid-template-columns:
      minmax(200px, 1fr)
      minmax(220px, 0.9fr)
      auto;
  }
}

@media (max-width: 900px) {
  .aimers-topbar {
    grid-template-columns: 1fr auto;
  }

  .topbar-search {
    display: none;
  }

  .focus-toggle span,
  .ask-aimers-button span {
    display: none;
  }

  .focus-toggle {
    padding: 0 9px;
  }

  .module-content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .aimers-topbar {
    min-height: 65px;
    padding: 9px 12px;
  }

  .topbar-greeting h1 {
    font-size: 14px;
  }

  .topbar-greeting p {
    display: none;
  }

  .topbar-icon-button:nth-of-type(2),
  .focus-toggle {
    display: none;
  }

  .ask-aimers-button {
    width: 38px;
    height: 38px;
    min-height: 38px;
    justify-content: center;
    padding: 0;
  }

  .aimers-page-content {
    padding: 10px;
  }

  .aimers-system-footer {
    grid-template-columns: 1fr auto;
  }

  .aimers-system-footer blockquote,
  .aimers-system-footer nav button {
    display: none;
  }

  .module-hero {
    min-height: 220px;
    align-items: flex-start;
    flex-direction: column;
    padding: 21px;
  }

  .module-stat-grid {
    grid-template-columns: 1fr;
  }
}
EOF

# ============================================================
# DASHBOARD STYLES
# ============================================================

cat > apps/web/src/pages/dashboard/dashboard.css <<'EOF'
.dashboard-page {
  display: grid;
  gap: 12px;
}

.dashboard-panel,
.metric-card,
.quick-actions-panel {
  border: 1px solid
    var(--aimers-border-soft);
  background:
    linear-gradient(
      180deg,
      rgba(11, 16, 35, 0.93),
      rgba(6, 10, 24, 0.93)
    );
  box-shadow:
    var(--aimers-shadow-panel);
}

.dashboard-metrics {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  position: relative;
  min-height: 150px;
  overflow: hidden;
  border-radius: 16px;
  padding: 14px;
  transition:
    transform var(--aimers-transition),
    border-color var(--aimers-transition);
}

.metric-card::before {
  position: absolute;
  inset: 0;
  opacity: 0.13;
  background:
    radial-gradient(
      circle at 90% 12%,
      currentColor,
      transparent 40%
    );
  content: "";
  pointer-events: none;
}

.metric-card:hover {
  transform: translateY(-3px);
  border-color: currentColor;
}

.metric-card > header {
  position: relative;
  display: grid;
  grid-template-columns: 25px 1fr auto;
  align-items: center;
  gap: 6px;
}

.metric-card header > span {
  color: #cbd0df;
  font-size: 10px;
}

.metric-icon {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 8px;
  background: color-mix(
    in srgb,
    currentColor 13%,
    transparent
  );
}

.metric-card header button {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border: 1px solid
    rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  color: inherit;
  background: rgba(255, 255, 255, 0.025);
}

.metric-value {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 18px;
}

.metric-value strong {
  color: #f7f8ff;
  font-size: 29px;
  font-weight: 500;
  letter-spacing: -0.045em;
}

.metric-value span {
  color: var(--aimers-text-secondary);
  font-size: 10px;
}

.metric-card > p {
  position: relative;
  margin: 2px 0 0;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.metric-sparkline {
  position: relative;
  width: 100%;
  height: 25px;
  margin-top: 6px;
}

.metric-card > small {
  position: relative;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.metric-orange {
  color: #fb6c4d;
}

.metric-blue {
  color: #4d89ff;
}

.metric-violet {
  color: #8972ff;
}

.metric-pink {
  color: #eb4f92;
}

.metric-green {
  color: #36d68c;
}

.dashboard-hero-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.56fr)
    minmax(420px, 0.84fr);
  gap: 10px;
  align-items: start;
}

.dashboard-primary-column,
.dashboard-secondary-column {
  display: grid;
  gap: 10px;
}

.mission-mentor-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1.05fr);
  gap: 10px;
}

.dashboard-panel {
  min-width: 0;
  border-radius: 16px;
  padding: 14px;
}

.panel-heading {
  display: flex;
  min-height: 30px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-heading h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.panel-heading > div > span {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.panel-count,
.ai-detected,
.prediction-tag {
  color: var(--aimers-text-secondary);
  font-size: 8px;
}

.mission-panel,
.mentor-panel {
  min-height: 290px;
}

.mission-content {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 9px;
}

.mission-list {
  display: grid;
  gap: 3px;
}

.mission-item {
  display: grid;
  min-height: 39px;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 7px;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
  color: var(--aimers-text-secondary);
}

.mission-item.completed {
  color: white;
}

.mission-state {
  display: grid;
  width: 19px;
  height: 19px;
  place-items: center;
  border: 1px solid
    rgba(119, 130, 168, 0.25);
  border-radius: 50%;
  color: var(--aimers-text-muted);
}

.mission-item.completed
  .mission-state {
  border-color:
    rgba(255, 93, 125, 0.4);
  color: white;
  background:
    linear-gradient(
      135deg,
      #e23a5e,
      #ff6a78
    );
  box-shadow:
    0 0 13px rgba(239, 71, 111, 0.25);
}

.mission-item strong {
  display: block;
  font-size: 9px;
  font-weight: 500;
}

.mission-item small {
  display: block;
  margin-top: 2px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.progress-ring {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background:
    conic-gradient(
      from 210deg,
      #6659ff 0deg,
      #a46fff
        calc(
          var(--ring-value) * 0.52
        ),
      #44e4bc
        var(--ring-value),
      rgba(71, 78, 113, 0.28)
        var(--ring-value)
    );
  box-shadow:
    0 0 25px rgba(92, 95, 255, 0.17);
}

.progress-ring::before {
  position: absolute;
  width: calc(100% - 13px);
  height: calc(100% - 13px);
  border-radius: 50%;
  background: #0a0f22;
  content: "";
}

.progress-ring {
  position: relative;
}

.progress-ring > div {
  position: relative;
  z-index: 1;
  text-align: center;
}

.progress-ring strong {
  display: block;
  font-size: 22px;
  font-weight: 500;
}

.progress-ring span {
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.mission-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid
    var(--aimers-border-soft);
  margin-top: 11px;
  padding-top: 11px;
}

.mission-footer > span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #aeb7cd;
  font-size: 8px;
}

.mission-footer > span svg {
  color: #56d69c;
}

.mission-footer a {
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 5px;
  border: 1px solid
    rgba(157, 93, 255, 0.3);
  border-radius: 8px;
  padding: 0 10px;
  background:
    linear-gradient(
      135deg,
      rgba(94, 47, 176, 0.75),
      rgba(118, 46, 195, 0.74)
    );
  font-size: 8px;
  text-decoration: none;
}

.mentor-panel {
  background:
    radial-gradient(
      circle at 95% 5%,
      rgba(182, 54, 238, 0.12),
      transparent 36%
    ),
    linear-gradient(
      180deg,
      rgba(12, 16, 39, 0.97),
      rgba(6, 10, 24, 0.97)
    );
}

.mentor-panel
  > .panel-heading
  > svg {
  color: #d067ff;
  filter:
    drop-shadow(
      0 0 8px rgba(202, 76, 255, 0.7)
    );
}

.mentor-conversation {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.mentor-message {
  max-width: 82%;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 11px;
  padding: 10px;
  font-size: 9px;
  line-height: 1.55;
}

.mentor-message.assistant {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 7px;
  background:
    rgba(255, 255, 255, 0.025);
}

.mentor-message.assistant > span {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border-radius: 7px;
  color: #78c6ff;
  background:
    rgba(45, 117, 220, 0.15);
}

.mentor-message p {
  margin: 0;
}

.mentor-message.user {
  justify-self: end;
  border-color:
    rgba(116, 91, 255, 0.32);
  background:
    linear-gradient(
      135deg,
      rgba(57, 52, 139, 0.72),
      rgba(65, 37, 148, 0.72)
    );
}

.mentor-message.compact {
  max-width: 70%;
}

.mentor-input {
  display: grid;
  min-height: 37px;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 10px;
  margin-top: 12px;
  padding: 0 8px 0 11px;
  color: var(--aimers-text-muted);
  background: rgba(255, 255, 255, 0.025);
  font-size: 8px;
}

.mentor-input a {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border-radius: 8px;
  color: white;
  background: var(--aimers-gradient-primary);
}

.dashboard-analysis-grid {
  display: grid;
  grid-template-columns:
    1.1fr 0.82fr 0.86fr 0.86fr;
  gap: 10px;
}

.dashboard-analysis-grid
  > .dashboard-panel {
  min-height: 225px;
}

.panel-filter {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 7px;
  padding: 4px 7px;
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.025);
  font-size: 7px;
}

.study-chart {
  display: grid;
  height: 145px;
  grid-template-columns: 22px 1fr;
  gap: 6px;
  margin-top: 10px;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.chart-plot {
  position: relative;
  border-left: 1px solid
    rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.04);
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 33px,
      rgba(255, 255, 255, 0.035)
        34px
    );
}

.chart-plot svg {
  width: 100%;
  height: 120px;
}

.chart-days {
  display: flex;
  justify-content: space-between;
  padding-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.chart-legend {
  display: flex;
  gap: 13px;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.chart-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.chart-legend i,
.subject-list i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.legend-study {
  background: #7368ff;
}

.legend-focus {
  background: #ec4899;
}

.subject-progress {
  display: grid;
  min-height: 170px;
  grid-template-columns: 1fr 0.95fr;
  place-items: center;
  gap: 10px;
}

.subject-donut {
  display: grid;
  width: 105px;
  height: 105px;
  place-items: center;
  border-radius: 50%;
  background:
    conic-gradient(
      #2563eb,
      #7c3aed,
      #ec4899,
      #f59e0b,
      #22c55e,
      #22d3ee,
      #2563eb
    );
  box-shadow:
    0 0 25px rgba(80, 91, 255, 0.16);
}

.subject-donut::before {
  position: absolute;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: #0a0f21;
  content: "";
}

.subject-donut {
  position: relative;
}

.subject-donut > div {
  position: relative;
  z-index: 1;
  text-align: center;
}

.subject-donut strong {
  display: block;
  font-size: 19px;
}

.subject-donut span {
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.subject-list {
  display: grid;
  width: 100%;
  gap: 10px;
}

.subject-list > span {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  color: var(--aimers-text-secondary);
  font-size: 8px;
}

.subject-list strong {
  font-weight: 500;
}

.subject-list .physics {
  background: #4982ff;
}

.subject-list .chemistry {
  background: #d853d7;
}

.subject-list .biology {
  background: #ec4f7f;
}

.subject-list .other {
  background: #22c8bd;
}

.weak-topic-list {
  display: grid;
  gap: 5px;
  margin-top: 12px;
}

.weak-topic-list section {
  display: grid;
  min-height: 29px;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 6px;
  border: 1px solid
    rgba(255, 255, 255, 0.035);
  border-radius: 7px;
  padding: 0 7px;
  background: rgba(255, 255, 255, 0.017);
}

.weak-topic-list strong {
  font-size: 7px;
  font-weight: 500;
}

.weak-topic-list small {
  font-size: 7px;
}

.weak-icon {
  display: grid;
  width: 19px;
  height: 19px;
  place-items: center;
  border-radius: 6px;
}

.weak-icon.danger {
  color: #ff6a7f;
  background: rgba(239, 71, 111, 0.11);
}

.weak-icon.warning {
  color: #ffb64a;
  background: rgba(245, 158, 11, 0.1);
}

.weak-icon.success {
  color: #62dc9d;
  background: rgba(34, 197, 94, 0.1);
}

.weak-topic-list small.danger {
  color: #ff6279;
}

.weak-topic-list small.warning {
  color: #f8af3c;
}

.weak-topic-list small.success {
  color: #54d79b;
}

.panel-full-link {
  display: flex;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid
    rgba(126, 99, 220, 0.14);
  border-radius: 8px;
  margin-top: 9px;
  color: #9ca2d2;
  background:
    rgba(94, 70, 187, 0.055);
  font-size: 7px;
  text-decoration: none;
}

.prediction-score {
  margin-top: 15px;
}

.prediction-score strong {
  display: block;
  color: #4f94ff;
  font-size: 22px;
  font-weight: 500;
}

.prediction-score span {
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.prediction-boxes {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-top: 13px;
}

.prediction-boxes section {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.018);
}

.prediction-boxes span {
  display: block;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.prediction-boxes strong {
  display: block;
  margin-top: 5px;
  font-size: 9px;
  font-weight: 500;
}

.prediction-boxes section:last-child
  strong {
  color: #54dca0;
}

.brain-panel {
  min-height: 315px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 56% 50%,
      rgba(80, 73, 255, 0.14),
      transparent 29%
    ),
    radial-gradient(
      circle at 73% 70%,
      rgba(222, 40, 216, 0.11),
      transparent 27%
    ),
    linear-gradient(
      180deg,
      rgba(7, 13, 32, 0.98),
      rgba(5, 10, 24, 0.98)
    );
}

.live-badge,
.active-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 4px 7px;
  color: #ff8aaa;
  background: rgba(239, 71, 111, 0.07);
  font-size: 7px;
}

.live-badge i,
.active-badge i,
.brain-status i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.active-badge {
  color: #55dd9c;
  background: rgba(34, 197, 94, 0.07);
}

.brain-map {
  display: grid;
  min-height: 225px;
  grid-template-columns:
    minmax(92px, 0.75fr)
    minmax(150px, 1.5fr)
    minmax(92px, 0.75fr);
  align-items: center;
  gap: 6px;
}

.brain-signals {
  display: grid;
  gap: 8px;
}

.brain-signals span {
  display: grid;
  border: 1px solid
    rgba(66, 133, 255, 0.23);
  border-radius: 8px;
  padding: 7px;
  color: #7db7ff;
  background: rgba(30, 85, 168, 0.07);
  font-size: 7px;
}

.brain-signals.right span {
  border-color:
    rgba(217, 83, 223, 0.21);
  color: #e381df;
  background:
    rgba(163, 50, 155, 0.055);
}

.brain-signals strong {
  margin-top: 3px;
  color: #47d9ca;
  font-size: 10px;
  font-weight: 500;
}

.brain-visual {
  position: relative;
  display: grid;
  min-height: 190px;
  place-items: center;
  color: #9c69ff;
}

.brain-visual > svg {
  position: relative;
  z-index: 4;
  filter:
    drop-shadow(
      0 0 13px rgba(108, 85, 255, 0.8)
    )
    drop-shadow(
      0 0 22px rgba(209, 47, 223, 0.45)
    );
}

.brain-orbit {
  position: absolute;
  border: 1px solid
    rgba(98, 108, 255, 0.28);
  border-radius: 50%;
  animation:
    aimers-orbit 11s linear infinite;
}

.orbit-one {
  width: 150px;
  height: 150px;
}

.orbit-two {
  width: 185px;
  height: 90px;
  transform: rotate(22deg);
  border-color:
    rgba(221, 67, 220, 0.26);
}

.orbit-three {
  width: 115px;
  height: 180px;
  transform: rotate(-25deg);
  border-color:
    rgba(41, 170, 255, 0.25);
}

.brain-node {
  position: absolute;
  z-index: 5;
  width: 7px;
  height: 7px;
  border: 1px solid white;
  border-radius: 50%;
  background: #a86aff;
  box-shadow:
    0 0 13px #a855f7;
}

.node-one {
  top: 30px;
  left: 42%;
}

.node-two {
  top: 50%;
  right: 28px;
}

.node-three {
  bottom: 28px;
  left: 40%;
}

.node-four {
  top: 48%;
  left: 23px;
}

.brain-status {
  display: flex;
  min-height: 27px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid
    rgba(59, 200, 162, 0.15);
  border-radius: 8px;
  padding: 0 9px;
  color: var(--aimers-text-muted);
  background: rgba(29, 133, 111, 0.04);
  font-size: 7px;
}

.brain-status > span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #54dda0;
}

.insights-activity-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 0.82fr)
    minmax(0, 1.18fr);
  gap: 10px;
}

.insights-activity-grid
  > .dashboard-panel {
  min-height: 190px;
}

.insight-card-content {
  display: grid;
  min-height: 130px;
  grid-template-columns: 1fr 80px;
  align-items: center;
  gap: 10px;
}

.insight-card-content p {
  margin: 0 0 4px;
  color: var(--aimers-text-secondary);
  font-size: 8px;
}

.insight-card-content strong {
  display: block;
  color: #ffae43;
  font-size: 10px;
}

.insight-card-content small {
  display: block;
  margin-top: 13px;
  color: var(--aimers-text-muted);
  font-size: 7px;
  line-height: 1.6;
}

.time-dial {
  display: grid;
  width: 74px;
  height: 74px;
  place-items: center;
  border: 7px solid
    rgba(61, 92, 255, 0.2);
  border-top-color: #386fff;
  border-right-color: #5d42ff;
  border-radius: 50%;
  color: #ff9f29;
}

.time-dial span {
  position: absolute;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.time-dial span:first-child {
  transform: translateY(-54px);
}

.time-dial span:last-child {
  transform: translateY(54px);
}

.activity-list {
  display: grid;
  gap: 5px;
  margin-top: 10px;
}

.activity-list > span {
  display: grid;
  min-height: 25px;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.025);
  color: var(--aimers-text-secondary);
  font-size: 8px;
}

.activity-list svg {
  color: #6f83ff;
}

.activity-list
  span:nth-child(2)
  svg {
  color: #ff4d68;
}

.activity-list
  span:nth-child(3)
  svg {
  color: #ff9b45;
}

.activity-list
  span:nth-child(4)
  svg {
  color: #4fdb95;
}

.activity-list strong {
  font-weight: 500;
}

.secondary-lower-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.15fr)
    minmax(0, 0.85fr);
  gap: 10px;
}

.memory-panel,
.voice-panel {
  min-height: 155px;
}

.memory-score {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 7px;
  margin-top: -4px;
}

.memory-score strong {
  color: #5c91ff;
  font-size: 22px;
  font-weight: 500;
}

.memory-score span {
  padding-bottom: 3px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.memory-line-chart {
  width: 100%;
  height: 58px;
  margin-top: 5px;
}

.memory-axis {
  display: flex;
  justify-content: space-between;
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.voice-panel {
  overflow: hidden;
  background:
    radial-gradient(
      circle at 85% 70%,
      rgba(194, 56, 239, 0.23),
      transparent 33%
    ),
    linear-gradient(
      180deg,
      rgba(13, 14, 41, 0.96),
      rgba(8, 9, 29, 0.96)
    );
}

.voice-panel > button {
  display: grid;
  width: 100%;
  min-height: 85px;
  grid-template-columns: 1fr auto;
  align-items: center;
  color: #4677ff;
  background: transparent;
}

.voice-panel button > span {
  display: grid;
  width: 66px;
  height: 66px;
  place-items: center;
  border: 1px solid
    rgba(215, 89, 255, 0.46);
  border-radius: 50%;
  color: white;
  background:
    radial-gradient(
      circle,
      #a72dcb,
      #45107d 60%,
      #140729 61%
    );
  box-shadow:
    0 0 26px rgba(184, 47, 237, 0.45);
}

.quick-actions-panel {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 17px;
  border-radius: 15px;
  padding: 11px 13px;
}

.quick-actions-panel h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
}

.quick-actions-panel > div {
  display: grid;
  grid-template-columns:
    repeat(8, minmax(90px, 1fr));
  gap: 6px;
  overflow-x: auto;
}

.quick-actions-panel a {
  display: flex;
  min-height: 43px;
  align-items: center;
  gap: 7px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 9px;
  padding: 0 8px;
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.018);
  text-decoration: none;
  white-space: nowrap;
}

.quick-actions-panel a:hover {
  border-color:
    rgba(150, 91, 255, 0.28);
  color: white;
  background: rgba(139, 92, 246, 0.07);
}

.quick-actions-panel a > span {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 7px;
  color: #ca70ff;
  background:
    rgba(143, 72, 227, 0.1);
}

.quick-actions-panel strong {
  font-size: 7px;
  font-weight: 500;
}

@keyframes aimers-orbit {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1550px) {
  .dashboard-hero-grid {
    grid-template-columns:
      minmax(0, 1.4fr)
      minmax(380px, 0.8fr);
  }

  .dashboard-analysis-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .dashboard-analysis-grid
    > .dashboard-panel {
    min-height: 220px;
  }

  .quick-actions-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1250px) {
  .dashboard-metrics {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .dashboard-hero-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-secondary-column {
    grid-template-columns: 1fr;
  }

  .brain-panel {
    min-height: 330px;
  }
}

@media (max-width: 880px) {
  .dashboard-metrics {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .mission-mentor-grid,
  .insights-activity-grid,
  .secondary-lower-grid {
    grid-template-columns: 1fr;
  }

  .mission-panel,
  .mentor-panel {
    min-height: auto;
  }
}

@media (max-width: 620px) {
  .dashboard-page {
    gap: 9px;
  }

  .dashboard-metrics {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }

  .metric-card {
    min-width: 190px;
    scroll-snap-align: start;
  }

  .dashboard-analysis-grid {
    grid-template-columns: 1fr;
  }

  .mission-content {
    grid-template-columns: 1fr;
  }

  .progress-ring {
    justify-self: center;
  }

  .mission-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .mission-footer a {
    justify-content: center;
  }

  .brain-map {
    grid-template-columns: 1fr;
  }

  .brain-signals {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .brain-signals.left {
    order: 2;
  }

  .brain-visual {
    order: 1;
  }

  .brain-signals.right {
    order: 3;
  }

  .brain-panel {
    min-height: auto;
  }

  .subject-progress {
    grid-template-columns: 1fr;
  }
}
EOF

echo "Student UI source files created."
