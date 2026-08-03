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
