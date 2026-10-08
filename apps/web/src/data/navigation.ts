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
