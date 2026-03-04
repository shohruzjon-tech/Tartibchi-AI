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
} from "lucide-react";
import { useRouter } from "../i18n/navigation";
import { useAuthStore } from "../lib/store";

const ROLE_CONFIG = {
  TENANT_ADMIN: {
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    redirectTo: "/dashboard",
  },
  BRANCH_MANAGER: {
    icon: UserCog,
    color: "from-blue-500 to-indigo-600",
    redirectTo: "/manager",
  },
  STAFF: {
    icon: Users,
    color: "from-emerald-500 to-teal-600",
    redirectTo: "/staff/login",
  },
} as const;

export function WorkspaceRoleSwitcher() {
  const t = useTranslations("switcher");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const currentRole = user.role as keyof typeof ROLE_CONFIG;
  const roleConfig = ROLE_CONFIG[currentRole] || ROLE_CONFIG.STAFF;
  const RoleIcon = roleConfig.icon;

  const handleSwitchWorkspace = () => {
    setOpen(false);
    clearAuth();
    router.push("/auth/login");
  };

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
        <ChevronDown size={14} className="text-content-tertiary" />
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
              className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl bg-surface-elevated border border-surface-tertiary/50 p-3 shadow-large"
            >
              {/* Current workspace info */}
              <div className="mb-3 rounded-xl bg-surface-secondary/60 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
                    <Building2 size={18} className="text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-content-primary">
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

              {/* Actions */}
              <div className="space-y-1">
                <button
                  onClick={handleSwitchWorkspace}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
                >
                  <ArrowRightLeft size={16} />
                  <span>{t("switchWorkspace")}</span>
                </button>
                <button
                  onClick={handleSwitchWorkspace}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
                >
                  <Shield size={16} />
                  <span>{t("switchRole")}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
