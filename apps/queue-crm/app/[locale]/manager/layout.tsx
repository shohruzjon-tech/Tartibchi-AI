"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "../../../i18n/navigation";
import { useAuthStore, useHydration } from "../../../lib/store";
import { Menu, ChevronDown, LogOut, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageSwitcher } from "../../../components/language-switcher";
import { ThemeToggle } from "../../../components/theme-toggle";
import { WorkspaceRoleSwitcher } from "../../../components/workspace-role-switcher";
import {
  getManagerSidebarGroups,
  isManagerRouteActive,
  isManagerGroupActive,
  type ManagerSidebarGroup,
  type ManagerSidebarRoute,
} from "../../../lib/manager-sidebar-routes";
import clsx from "clsx";

/* ─── Sidebar Nav Item ─── */
function SidebarNavItem({
  route,
  isActive,
  onNavigate,
  t,
}: {
  route: ManagerSidebarRoute;
  isActive: boolean;
  onNavigate?: () => void;
  t: (key: string) => string;
}) {
  const Icon = route.icon;
  return (
    <Link
      href={route.href}
      onClick={onNavigate}
      className={clsx(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200",
        isActive
          ? "text-accent-primary"
          : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary",
      )}
    >
      {isActive && (
        <motion.div
          layoutId="manager-sidebar-active"
          className="absolute inset-0 rounded-xl bg-accent-primary/8"
          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
        />
      )}
      <Icon
        size={17}
        strokeWidth={isActive ? 2 : 1.5}
        className={clsx(
          "relative z-10 shrink-0 transition-colors",
          isActive
            ? "text-accent-primary"
            : "text-content-tertiary group-hover:text-content-secondary",
        )}
      />
      <span className="relative z-10 truncate">{t(route.labelKey)}</span>
    </Link>
  );
}

/* ─── Sidebar Group Section ─── */
function SidebarGroupSection({
  group,
  pathname,
  isCollapsed,
  onToggle,
  onNavigate,
  t,
  ts,
}: {
  group: ManagerSidebarGroup;
  pathname: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  t: (key: string) => string;
  ts: (key: string) => string;
}) {
  const hasActive = isManagerGroupActive(pathname, group);

  if (!group.collapsible) {
    return (
      <div className="space-y-0.5">
        {group.routes.map((route) => (
          <SidebarNavItem
            key={route.href}
            route={route}
            isActive={isManagerRouteActive(pathname, route)}
            onNavigate={onNavigate}
            t={t}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        onClick={onToggle}
        className={clsx(
          "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
          hasActive
            ? "text-accent-primary/70"
            : "text-content-tertiary hover:text-content-secondary",
        )}
      >
        <span className="flex items-center gap-2">
          {ts(group.titleKey)}
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-surface-secondary px-1 text-[10px] font-medium text-content-tertiary">
            {group.routes.length}
          </span>
        </span>
        <motion.div
          animate={{ rotate: isCollapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={12} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key={group.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
            }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pl-0.5">
              {group.routes.map((route) => (
                <SidebarNavItem
                  key={route.href}
                  route={route}
                  isActive={isManagerRouteActive(pathname, route)}
                  onNavigate={onNavigate}
                  t={t}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Manager Sidebar ─── */
function ManagerSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("manager");
  const ts = useTranslations("sidebar");
  const pathname = usePathname();
  const groups = useMemo(() => getManagerSidebarGroups(), []);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of groups) {
      if (!g.collapsible) continue;
      const hasActive = isManagerGroupActive(pathname, g);
      initial[g.id] = hasActive ? false : (g.defaultCollapsed ?? false);
    }
    return initial;
  });

  const toggle = useCallback((groupId: string) => {
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col bg-surface-elevated shadow-medium">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-surface-secondary/60 px-5">
        <Link href="/manager" onClick={onNavigate}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-lg font-semibold gradient-text">
              {t("title")}
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 scrollbar-thin">
        {groups.map((group) => (
          <SidebarGroupSection
            key={group.id}
            group={group}
            pathname={pathname}
            isCollapsed={collapsed[group.id] ?? false}
            onToggle={() => toggle(group.id)}
            onNavigate={onNavigate}
            t={t}
            ts={ts}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-surface-secondary/60 p-4">
        <div className="rounded-xl bg-surface-secondary/60 p-3 text-center">
          <p className="text-[11px] text-content-tertiary">
            {t("branchManager")}
          </p>
        </div>
      </div>
    </aside>
  );
}

/* ─── Manager Layout ─── */
export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hasHydrated = useHydration();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hasHydrated && !user) {
      router.push("/auth/login");
    }
  }, [user, hasHydrated, router]);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-surface-primary">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ManagerSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 lg:hidden"
            >
              <ManagerSidebar onNavigate={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-3 bg-surface-elevated px-4 shadow-soft sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-content-secondary transition-colors hover:bg-surface-secondary lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <WorkspaceRoleSwitcher />
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => {
                clearAuth();
                router.push("/auth/login");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-status-error"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-6xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
