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
