"use client";

import { useAlertStore, type AlertType } from "../../lib/alert-store";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const iconMap: Record<AlertType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const styleMap: Record<
  AlertType,
  {
    bg: string;
    border: string;
    icon: string;
    title: string;
    glow: string;
    bar: string;
  }
> = {
  success: {
    bg: "bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08]",
    border: "border-emerald-500/20",
    icon: "text-emerald-500",
    title: "text-emerald-700 dark:text-emerald-400",
    glow: "shadow-[0_0_24px_rgba(16,185,129,0.12)]",
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-400",
  },
  error: {
    bg: "bg-red-500/[0.06] dark:bg-red-500/[0.08]",
    border: "border-red-500/20",
    icon: "text-red-500",
    title: "text-red-700 dark:text-red-400",
    glow: "shadow-[0_0_24px_rgba(239,68,68,0.12)]",
    bar: "bg-gradient-to-r from-red-500 to-rose-400",
  },
  warning: {
    bg: "bg-amber-500/[0.06] dark:bg-amber-500/[0.08]",
    border: "border-amber-500/20",
    icon: "text-amber-500",
    title: "text-amber-700 dark:text-amber-400",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.12)]",
    bar: "bg-gradient-to-r from-amber-500 to-yellow-400",
  },
  info: {
    bg: "bg-blue-500/[0.06] dark:bg-blue-500/[0.08]",
    border: "border-blue-500/20",
    icon: "text-blue-500",
    title: "text-blue-700 dark:text-blue-400",
    glow: "shadow-[0_0_24px_rgba(59,130,246,0.12)]",
    bar: "bg-gradient-to-r from-blue-500 to-cyan-400",
  },
};

export function AlertContainer() {
  const alerts = useAlertStore((s) => s.alerts);
  const removeAlert = useAlertStore((s) => s.removeAlert);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-2.5 pointer-events-none max-w-[420px] w-full">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => {
          const s = styleMap[alert.type];
          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9, filter: "blur(4px)" }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 350,
                mass: 0.8,
              }}
              className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border backdrop-blur-xl ${s.bg} ${s.border} ${s.glow}`}
            >
              {/* Top accent bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-[2px] ${s.bar}`}
              />

              <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
                {/* Icon with pulse ring */}
                <div className="relative shrink-0 mt-0.5">
                  <div
                    className={`absolute inset-0 rounded-full ${s.icon} opacity-20 animate-ping`}
                    style={{ animationDuration: "2s" }}
                  />
                  <span className={s.icon}>{iconMap[alert.type]}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold leading-tight ${s.title}`}
                  >
                    {alert.title}
                  </p>
                  {alert.message && (
                    <p className="mt-0.5 text-xs text-content-secondary leading-relaxed line-clamp-2">
                      {alert.message}
                    </p>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="shrink-0 rounded-lg p-1 text-content-tertiary transition-all hover:bg-surface-secondary hover:text-content-primary"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Animated progress bar for timed alerts */}
              {(alert.duration === undefined || alert.duration > 0) && (
                <div className="h-[2px] w-full bg-transparent overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{
                      duration: (alert.duration ?? 5000) / 1000,
                      ease: "linear",
                    }}
                    className={`h-full ${s.bar} opacity-40`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
