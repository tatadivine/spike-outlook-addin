import {
  Home, Inbox, Award, Users, ClipboardCheck, Building2, BarChart3, FileText,
  Settings, HelpCircle, type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  children?: { label: string; path: string }[];
  minRole?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/dashboard", icon: Home },
  {
    label: "Communication", path: "/communication", icon: Inbox,
    children: [
      { label: "My Communication", path: "/communication" },
      { label: "Commitments", path: "/commitments" },
      { label: "Follow-ups", path: "/followups" },
      { label: "Alerts", path: "/alerts" },
    ],
  },
  {
    label: "Performance", path: "/performance", icon: Award,
    children: [
      { label: "My Performance", path: "/performance" },
      { label: "Coaching", path: "/coaching" },
      { label: "Evidence", path: "/evidence" },
    ],
  },
  { label: "Customers", path: "/customers", icon: Users },
  {
    label: "Team", path: "/team", icon: ClipboardCheck,
    minRole: ["team_lead", "manager", "administrator"],
    children: [
      { label: "Team Overview", path: "/team" },
      { label: "Reviews", path: "/reviews" },
      { label: "Team Trends", path: "/team/trends" },
    ],
  },
  {
    label: "Organization", path: "/organization", icon: Building2,
    minRole: ["manager", "administrator"],
    children: [
      { label: "Overview", path: "/organization" },
      { label: "Departments", path: "/organization/departments" },
      { label: "Trends", path: "/organization/trends" },
    ],
  },
  { label: "Analytics", path: "/analytics", icon: BarChart3, minRole: ["manager", "administrator"] },
  { label: "Reports", path: "/reports", icon: FileText, minRole: ["manager", "administrator"] },
  {
    label: "Settings", path: "/settings", icon: Settings, minRole: ["administrator"],
    children: [
      { label: "General", path: "/settings" },
      { label: "Scoring", path: "/settings/scoring" },
      { label: "Exclusions", path: "/settings/exclusions" },
      { label: "Permissions", path: "/settings/permissions" },
      { label: "Integrations", path: "/settings/integrations" },
      { label: "Audit Log", path: "/settings/audit" },
    ],
  },
  { label: "Help", path: "/help", icon: HelpCircle },
];

export function visibleNav(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.minRole || item.minRole.includes(role));
}
