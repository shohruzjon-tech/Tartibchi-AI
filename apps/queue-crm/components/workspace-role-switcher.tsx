"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Shield,
  Users,
  UserCog,
  Crown,
  ArrowRightLeft,
  Check,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "../i18n/navigation";
import { useAuthStore } from "../lib/store";

const ROLE_CONFIG = {
  TENANT_ADMIN: {
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
    redirectTo: "/dashboard",
  },
  BRANCH_MANAGER: {
    icon: UserCog,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
    redirectTo: "/manager",
  },
  STAFF: {
    icon: Users,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/20",
    redirectTo: "/staff/select-counter",
  },
} as const;

type RoleKey = keyof typeof ROLE_CONFIG;

export function WorkspaceRoleSwitcher() {
  const t = useTranslations("switcher");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  // Only show role switcher for multi-employee workspaces
  if (user.tenantMode !== "MULTI") return null;

  const currentRole = user.role as RoleKey;
  const roleConfig = ROLE_CONFIG[currentRole] || ROLE_CONFIG.STAFF;
  const RoleIcon = roleConfig.icon;

  const handleNavigateToRole = (role: RoleKey) => {
    setOpen(false);
    const config = ROLE_CONFIG[role];
    router.push(config.redirectTo);
  };

  const handleSwitchWorkspace = () => {
    setOpen(false);
    // Preserve phone for quick re-login
    if (user.phone) {
      try {
        sessionStorage.setItem("qs_switch_phone", user.phone);
      } catch {}
    }
    clearAuth();
    router.push("/auth/login");
  };

  // All available roles the user could navigate to
  const otherRoles = (Object.keys(ROLE_CONFIG) as RoleKey[]).filter(
    (r) => r !== currentRole,
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-xl bg-surface-secondary/60 py-1.5 pl-2 pr-3 transition-all hover:bg-surface-tertiary"
      >
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${roleConfig.color}`}
        >
          <RoleIcon size={14} className="text-white" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-content-primary leading-tight">
            {user.workspaceName || t("workspace")}
          </p>
          <p className="text-[10px] text-content-tertiary leading-tight">
            {t(`role_${user.role}`)}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-content-tertiary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl bg-surface-elevated border border-surface-tertiary/50 p-3 shadow-large"
            >
              {/* Current workspace & role */}
              <div className="mb-3 rounded-xl bg-surface-secondary/60 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
                    <Building2 size={18} className="text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-content-primary truncate">
                      {user.workspaceName || t("currentWorkspace")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br ${roleConfig.color}`}
                      >
                        <RoleIcon size={10} className="text-white" />
                      </div>
                      <span className="text-xs text-content-secondary">
                        {t(`role_${user.role}`)}
                      </span>
                      <Check
                        size={12}
                        className="text-status-success ml-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigate to other role sections */}
              {otherRoles.length > 0 && (
                <div className="mb-2">
                  <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                    {t("switchRole")}
                  </p>
                  <div className="space-y-1">
                    {otherRoles.map((role) => {
                      const config = ROLE_CONFIG[role];
                      const Icon = config.icon;
                      return (
                        <button
                          key={role}
                          onClick={() => handleNavigateToRole(role)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-surface-secondary group`}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${config.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                          >
                            <Icon size={14} className="text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <span className="text-[13px] font-medium text-content-secondary group-hover:text-content-primary transition-colors">
                              {t(`role_${role}`)}
                            </span>
                          </div>
                          <ExternalLink
                            size={13}
                            className="text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="my-2 border-t border-surface-tertiary/50" />

              {/* Switch workspace (requires re-auth) */}
              <button
                onClick={handleSwitchWorkspace}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
              >
                <ArrowRightLeft size={16} />
                <div className="flex-1 text-left">
                  <span className="text-[13px] font-medium">
                    {t("switchWorkspace")}
                  </span>
                  <p className="text-[10px] text-content-tertiary">
                    {t("switchWorkspaceDesc")}
                  </p>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
