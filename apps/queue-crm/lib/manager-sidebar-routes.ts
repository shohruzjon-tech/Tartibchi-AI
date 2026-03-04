import {
  BarChart3,
  ClipboardList,
  Monitor,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface ManagerSidebarRoute {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface ManagerSidebarGroup {
  id: string;
  titleKey: string;
  collapsible: boolean;
  defaultCollapsed?: boolean;
  routes: ManagerSidebarRoute[];
}

const MANAGER_GROUPS: ManagerSidebarGroup[] = [
  {
    id: "main",
    titleKey: "main",
    collapsible: false,
    routes: [
      {
        href: "/manager",
        labelKey: "overview",
        icon: BarChart3,
        exact: true,
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
        href: "/manager/staff",
        labelKey: "staff",
        icon: Users,
      },
      {
        href: "/manager/services",
        labelKey: "services",
        icon: ClipboardList,
      },
      {
        href: "/manager/counters",
        labelKey: "counters",
        icon: Monitor,
      },
    ],
  },
  {
    id: "system",
    titleKey: "system",
    collapsible: true,
    defaultCollapsed: true,
    routes: [
      {
        href: "/manager/settings",
        labelKey: "settings",
        icon: Settings,
      },
    ],
  },
];

export function getManagerSidebarGroups(): ManagerSidebarGroup[] {
  return MANAGER_GROUPS;
}

export function isManagerRouteActive(
  pathname: string,
  route: ManagerSidebarRoute,
): boolean {
  if (route.exact) return pathname === route.href;
  return pathname === route.href || pathname.startsWith(route.href + "/");
}

export function isManagerGroupActive(
  pathname: string,
  group: ManagerSidebarGroup,
): boolean {
  return group.routes.some((r) => isManagerRouteActive(pathname, r));
}
