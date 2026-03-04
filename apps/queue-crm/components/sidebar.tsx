"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useAuthStore } from "../lib/store";
import {
  getSidebarGroups,
  isRouteActive,
  isGroupActive,
  type SidebarGroup,
  type SidebarRoute,
  type TenantMode,
} from "../lib/sidebar-routes";

// ─── Collapse persistence (survives re-renders, not page reloads) ──

function useCollapsedState(groups: SidebarGroup[], pathname: string) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of groups) {
      if (!g.collapsible) continue;
      // Auto-expand if a child route is active, else use default
      const hasActive = isGroupActive(pathname, g);
      initial[g.id] = hasActive ? false : (g.defaultCollapsed ?? false);
    }
    return initial;
  });

  const toggle = useCallback((groupId: string) => {
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  return { collapsed, toggle };
}

// ─── Animations ──────────────────────────────────────────

const collapseVariants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const activeIndicatorTransition = {
  type: "spring" as const,
  bounce: 0.15,
  duration: 0.5,
};

// ─── SidebarNavItem ──────────────────────────────────────

function SidebarNavItem({
  route,
  isActive,
  onNavigate,
  t,
}: {
  route: SidebarRoute;
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
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-accent-primary/8"
          transition={activeIndicatorTransition}
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

// ─── SidebarGroupSection ─────────────────────────────────

function SidebarGroupSection({
  group,
  pathname,
  isCollapsed,
  onToggle,
  onNavigate,
  t,
  ts,
}: {
  group: SidebarGroup;
  pathname: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  t: (key: string) => string;
  ts: (key: string) => string;
}) {
  const hasActive = isGroupActive(pathname, group);

  // Non-collapsible group — render items directly (no header)
  if (!group.collapsible) {
    return (
      <div className="space-y-0.5">
        {group.routes.map((route) => (
          <SidebarNavItem
            key={route.href}
            route={route}
            isActive={isRouteActive(pathname, route)}
            onNavigate={onNavigate}
            t={t}
          />
        ))}
      </div>
    );
  }

  const routeCount = group.routes.length;

  return (
    <div className="space-y-0.5">
      {/* Group header — clickable toggle */}
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
            {routeCount}
          </span>
        </span>
        <motion.div
          animate={{ rotate: isCollapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={12} />
        </motion.div>
      </button>

      {/* Collapsible route list */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key={group.id}
            initial="closed"
            animate="open"
            exit="closed"
            variants={collapseVariants}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pl-0.5">
              {group.routes.map((route) => (
                <SidebarNavItem
                  key={route.href}
                  route={route}
                  isActive={isRouteActive(pathname, route)}
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

// ─── Main Sidebar ────────────────────────────────────────

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("dashboard");
  const ts = useTranslations("sidebar");
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const mode: TenantMode = user?.tenantMode === "SOLO" ? "SOLO" : "MULTI";
  const groups = useMemo(() => getSidebarGroups(mode), [mode]);
  const { collapsed, toggle } = useCollapsedState(groups, pathname);

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col bg-surface-elevated shadow-medium">
      {/* ── Logo (pinned top, aligned with header height) ── */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-surface-secondary/60 px-5">
        <Link href="/" onClick={onNavigate}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
              <span className="text-sm font-bold text-white">Q</span>
            </div>
            <span className="text-lg font-semibold gradient-text">
              QueuePro
            </span>
          </div>
        </Link>
      </div>

      {/* ── Scrollable navigation area ── */}
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

      {/* ── Pinned footer ── */}
      <div className="shrink-0 space-y-2 border-t border-surface-secondary/60 p-4">
        {/* Upgrade CTA for solo users */}
        {mode === "SOLO" && (
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 p-3 text-xs font-medium text-accent-primary transition-colors hover:from-accent-primary/15 hover:to-accent-secondary/15"
          >
            <ArrowUpRight size={14} />
            <span>{t("upgradeToMulti")}</span>
          </Link>
        )}

        {/* Version badge */}
        <div className="rounded-xl bg-surface-secondary/60 p-3 text-center">
          <p className="text-[11px] text-content-tertiary">QueuePro v0.1.0</p>
        </div>
      </div>
    </aside>
  );
}
