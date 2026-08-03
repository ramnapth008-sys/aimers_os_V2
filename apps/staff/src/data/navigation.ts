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
