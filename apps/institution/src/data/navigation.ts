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
