import {
  BarChart3,
  ClipboardList,
  Monitor,
  Building2,
  TrendingUp,
  Settings,
  Users,
  UserCircle,
  Calendar,
  type LucideIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

export interface SidebarRoute {
  href: string;
  labelKey: string; // i18n key under "dashboard"
  icon: LucideIcon;
  /** If true, exact path match; otherwise prefix match */
  exact?: boolean;
}

export interface SidebarGroup {
  id: string;
  titleKey: string; // i18n key under "sidebar"
  collapsible: boolean;
  /** Default collapsed state (only relevant when collapsible = true) */
  defaultCollapsed?: boolean;
  routes: SidebarRoute[];
}

export type TenantMode = "SOLO" | "MULTI";

// ─── Route Definitions ──────────────────────────────────

const MULTI_GROUPS: SidebarGroup[] = [
  {
    id: "main",
    titleKey: "main",
    collapsible: false,
    routes: [
      {
        href: "/dashboard",
        labelKey: "overview",
        icon: BarChart3,
        exact: true,
      },
      {
        href: "/dashboard/analytics",
        labelKey: "analytics",
        icon: TrendingUp,
      },
    ],
  },
  {
    id: "management",
    titleKey: "management",
    collapsible: true,
    defaultCollapsed: false,
    routes: [
      {
        href: "/dashboard/services",
        labelKey: "services",
        icon: ClipboardList,
      },
      { href: "/dashboard/counters", labelKey: "counters", icon: Monitor },
      { href: "/dashboard/branches", labelKey: "branches", icon: Building2 },
      { href: "/dashboard/employees", labelKey: "staff", icon: Users },
      {
        href: "/dashboard/customers",
        labelKey: "customers",
        icon: UserCircle,
      },
    ],
  },
  {
    id: "system",
    titleKey: "system",
    collapsible: true,
    defaultCollapsed: true,
    routes: [
      { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

const SOLO_GROUPS: SidebarGroup[] = [
  {
    id: "main",
    titleKey: "main",
    collapsible: false,
    routes: [
      {
        href: "/dashboard",
        labelKey: "overview",
        icon: BarChart3,
        exact: true,
      },
      {
        href: "/dashboard/analytics",
        labelKey: "analytics",
        icon: TrendingUp,
      },
    ],
  },
  {
    id: "management",
    titleKey: "management",
    collapsible: true,
    defaultCollapsed: false,
    routes: [
      {
        href: "/dashboard/appointments",
        labelKey: "appointments",
        icon: Calendar,
      },
      {
        href: "/dashboard/solo-services",
        labelKey: "services",
        icon: ClipboardList,
      },
      {
        href: "/dashboard/customers",
        labelKey: "customers",
        icon: UserCircle,
      },
    ],
  },
  {
    id: "system",
    titleKey: "system",
    collapsible: true,
    defaultCollapsed: true,
    routes: [
      { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

// ─── Factory ─────────────────────────────────────────────

export function getSidebarGroups(mode: TenantMode): SidebarGroup[] {
  return mode === "SOLO" ? SOLO_GROUPS : MULTI_GROUPS;
}

// ─── Active-state helper ─────────────────────────────────

export function isRouteActive(pathname: string, route: SidebarRoute): boolean {
  if (route.exact) return pathname === route.href;
  return pathname === route.href || pathname.startsWith(route.href + "/");
}

/** Check if any route inside a group is active */
export function isGroupActive(pathname: string, group: SidebarGroup): boolean {
  return group.routes.some((r) => isRouteActive(pathname, r));
}
