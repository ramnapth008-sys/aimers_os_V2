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
  Link2,
  Monitor,
  NotebookPen,
  Search,
  Settings,
  TrendingUp,
  Trophy,
  Users,
  CircleHelp,
  CreditCard,
  Timer,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  keywords?: string;
}

// Everyday destinations stay small; specialist tools remain discoverable.
export const primaryNavigation: NavigationItem[] = [
  {
    label: "Today",
    path: "/dashboard",
    icon: Home,
    keywords: "dashboard home mission",
  },
  {
    label: "Learn",
    path: "/subjects",
    icon: BookOpen,
    keywords: "subjects syllabus chapters",
  },
  {
    label: "Plan",
    path: "/planner",
    icon: CalendarDays,
    keywords: "planner tasks study session",
  },
  {
    label: "Progress",
    path: "/analytics",
    icon: BarChart3,
    keywords: "analytics results",
  },
  {
    label: "Companion",
    path: "/ai-mentor",
    icon: Bot,
    keywords: "ai mentor chat doubt",
  },
];

export const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  {
    label: "Study tools",
    items: [
      {
        label: "Practice questions",
        path: "/question-bank",
        icon: Library,
        keywords: "question bank",
      },
      { label: "Mock tests", path: "/mock-tests", icon: FileQuestion },
      { label: "Flashcards", path: "/flashcards", icon: Layers3 },
      { label: "Notes", path: "/notes", icon: NotebookPen },
      {
        label: "Research",
        path: "/research-ai",
        icon: Search,
        keywords: "research ai",
      },
    ],
  },
  {
    label: "More insights",
    items: [
      {
        label: "Study habits",
        path: "/behavior-ai",
        icon: Activity,
        keywords: "behavior ai",
      },
      { label: "Digital activity", path: "/digital-activity", icon: Monitor },
      {
        label: "Readiness estimates",
        path: "/prediction",
        icon: TrendingUp,
        keywords: "prediction",
      },
      {
        label: "Revision memory",
        path: "/memory-engine",
        icon: Brain,
        keywords: "memory engine",
      },
      {
        label: "Detailed dashboard",
        path: "/dashboard/details",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Explore",
    items: [
      { label: "Community", path: "/community", icon: Users },
      { label: "Achievements", path: "/achievements", icon: Trophy },
      { label: "Calendar", path: "/calendar", icon: CalendarDays },
      { label: "Focus room", path: "/focus-room", icon: Timer },
    ],
  },
];
export const secondaryNavigation: NavigationItem[] = [
  {
    label: "Connections",
    path: "/integrations",
    icon: Link2,
    keywords: "devices integrations tracking",
  },
  {
    label: "Settings & privacy",
    path: "/settings",
    icon: Settings,
    keywords: "permissions consent",
  },
];
export const allNavigation: NavigationItem[] = [
  ...primaryNavigation,
  ...navigationGroups.flatMap((group) => group.items),
  ...secondaryNavigation,
  { label: "Help & feedback", path: "/help-support", icon: CircleHelp },
  { label: "Subscription", path: "/subscription", icon: CreditCard },
  { label: "Billing", path: "/billing", icon: CreditCard },
];
