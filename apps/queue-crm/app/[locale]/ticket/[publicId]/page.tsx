"use client";

import { useState, useEffect, use } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Loader2,
  ArrowRight,
  LayoutDashboard,
  Zap,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Link } from "../../../../i18n/navigation";
import { api } from "../../../../lib/api";
import { useSocket } from "../../../../lib/hooks/use-socket";

/* ─── Status Configuration ─── */
const STATUS_CONFIG: Record<
  string,
  {
    bg: string;
    text: string;
    icon: any;
    glow?: string;
    gradient: string;
    pulse?: boolean;
    border: string;
  }
> = {
  WAITING: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    icon: Clock,
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.12)]",
    gradient: "from-amber-500/20 via-amber-400/5 to-transparent",
    border: "border-amber-500/20",
  },
  CALLED: {
    bg: "bg-accent-primary/12",
    text: "text-accent-primary",
    icon: Zap,
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.25)]",
    gradient: "from-accent-primary/20 via-accent-primary/5 to-transparent",
    pulse: true,
    border: "border-accent-primary/30",
  },
  SERVING: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: ArrowRight,
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.18)]",
    gradient: "from-emerald-500/20 via-emerald-400/5 to-transparent",
    border: "border-emerald-500/20",
  },
  DONE: {
    bg: "bg-surface-secondary",
    text: "text-content-secondary",
    icon: CheckCircle2,
    gradient: "from-surface-secondary via-surface-primary to-transparent",
    border: "border-surface-tertiary",
  },
  SKIPPED: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    icon: XCircle,
    gradient: "from-red-500/15 via-red-400/5 to-transparent",
    border: "border-red-500/20",
  },
};

/* ─── Dashboard Button ─── */
function DashboardButton() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Link
        href="/dashboard"
        className="group inline-flex items-center gap-2 rounded-xl bg-surface-elevated/80 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-content-secondary shadow-medium transition-all hover:bg-surface-elevated hover:text-accent-primary hover:shadow-large"
      >
        <LayoutDashboard size={16} strokeWidth={1.8} />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
    </div>
  );
}

/* ─── Animated Background Orbs ─── */
function AmbientOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent-primary/6 blur-[120px] animate-pulse" />
      <div className="absolute top-1/2 -right-48 h-[500px] w-[500px] rounded-full bg-accent-secondary/5 blur-[140px] animate-pulse [animation-delay:2s]" />
      <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-accent-tertiary/4 blur-[100px] animate-pulse [animation-delay:4s]" />
    </div>
  );
}

/* ─── Pulsing Ring Animation (for CALLED status) ─── */
function PulsingRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-accent-primary/20"
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{
            width: [80, 200],
            height: [80, 200],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Progress Dots ─── */
function ProgressDots({ currentStatus }: { currentStatus: string }) {
  const steps = ["WAITING", "CALLED", "SERVING", "DONE"];
  const currentIdx = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center gap-2">
          <motion.div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              idx <= currentIdx
                ? idx === currentIdx
                  ? "w-8 bg-accent-primary"
                  : "w-2.5 bg-accent-primary/50"
                : "w-2.5 bg-surface-tertiary"
            }`}
            layout
          />
          {idx < steps.length - 1 && (
            <div
              className={`h-px w-4 ${
                idx < currentIdx
                  ? "bg-accent-primary/30"
                  : "bg-surface-tertiary"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function TicketPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = use(params);
  const t = useTranslations("queue");
  const tc = useTranslations("common");
  const { trackTicket, onEvent } = useSocket();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.tickets
      .status(publicId)
      .then((data) => {
        setTicket(data);
        trackTicket(data._id || data.id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [publicId, trackTicket]);

  useEffect(() => {
    const unsub = onEvent("ticketUpdate", (data: any) => {
      if (data.publicId === publicId) {
        setTicket((prev: any) => ({ ...prev, ...data }));
      }
    });
    return unsub;
  }, [publicId, onEvent]);

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-primary">
        <AmbientOrbs />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-accent-primary/20" />
            <motion.div
              className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-accent-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-sm text-content-tertiary">{tc("loading")}</p>
        </motion.div>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (!ticket) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-primary px-4">
        <AmbientOrbs />
        <DashboardButton />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-3xl bg-surface-elevated/80 backdrop-blur-sm p-8 text-center shadow-large border border-surface-tertiary"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <p className="text-lg font-semibold text-content-primary">
            {tc("error")}
          </p>
          <p className="mt-2 text-sm text-content-tertiary">Ticket not found</p>
        </motion.div>
      </div>
    );
  }

  const statusKey = ticket.status?.toLowerCase() || "waiting";
  const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.WAITING;
  const StatusIcon = statusConf.icon;
  const isCalled = ticket.status === "CALLED";
  const isWaiting = ticket.status === "WAITING";
  const isDone = ticket.status === "DONE";
  const isSkipped = ticket.status === "SKIPPED";
  const isServing = ticket.status === "SERVING";

  return (
    <div className="relative min-h-[100dvh] bg-surface-primary">
      <AmbientOrbs />
      <DashboardButton />

      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 py-8 sm:py-12">
        {/* ─── Ticket Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          <div
            className={`relative overflow-hidden rounded-3xl bg-surface-elevated/80 backdrop-blur-sm border border-surface-tertiary shadow-large transition-shadow duration-700 ${statusConf.glow || ""}`}
          >
            {/* ─── Gradient Header ─── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-accent-primary via-accent-primary/90 to-accent-tertiary p-8 sm:p-10 text-center text-white">
              {/* Decorative grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
                  backgroundSize: "20px 20px",
                }}
              />
              {/* Radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />

              {/* Pulsing rings for CALLED state */}
              {isCalled && <PulsingRings />}

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.15,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                className="relative"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Ticket size={18} className="text-white/90" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  {t("yourTicket")}
                </p>
                <motion.h1
                  className="text-5xl sm:text-6xl font-black tracking-wider"
                  key={ticket.displayNumber}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {ticket.displayNumber}
                </motion.h1>
              </motion.div>
            </div>

            {/* ─── Status Badge Bar ─── */}
            <div className="border-b border-surface-tertiary px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-content-tertiary">
                  {t("status")}
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ticket.status}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${statusConf.bg} ${statusConf.text} ${statusConf.border} border`}
                  >
                    {isCalled && (
                      <motion.span
                        className="h-1.5 w-1.5 rounded-full bg-accent-primary"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                        }}
                      />
                    )}
                    <StatusIcon size={12} />
                    {t(statusKey)}
                  </motion.span>
                </AnimatePresence>
              </div>
              {/* Progress Dots */}
              {!isSkipped && (
                <div className="mt-3">
                  <ProgressDots currentStatus={ticket.status || "WAITING"} />
                </div>
              )}
            </div>

            {/* ─── Content Section ─── */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* ─── WAITING: Position + Wait Time ─── */}
                {isWaiting && (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    {/* Position Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/8 via-surface-secondary to-surface-secondary p-5 border border-amber-500/10">
                      <div
                        className="absolute inset-0 opacity-[0.02]"
                        style={{
                          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                          backgroundSize: "16px 16px",
                        }}
                      />
                      <div className="relative flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                          <Users
                            size={20}
                            className="text-amber-600 dark:text-amber-400"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-content-tertiary">
                            {t("position")}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <motion.span
                              key={ticket.position}
                              initial={{ scale: 1.2, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-3xl font-black text-content-primary"
                            >
                              {ticket.position ?? "—"}
                            </motion.span>
                            <span className="text-sm text-content-tertiary">
                              {ticket.position == null
                                ? ""
                                : ticket.position === 0
                                  ? t("noPeople")
                                  : `${ticket.position} ${t("people")}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estimated Wait Card */}
                    {ticket.estimatedWait && (
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-primary/6 via-surface-secondary to-surface-secondary p-5 border border-accent-primary/10">
                        <div className="relative flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10">
                            <Clock size={20} className="text-accent-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wider text-content-tertiary">
                              {t("estimated")}
                            </p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-accent-primary">
                                ~{ticket.estimatedWait}
                              </span>
                              <span className="text-sm font-medium text-accent-primary/70">
                                {t("minutes")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Wait Message */}
                    <p className="text-center text-sm text-content-tertiary">
                      {t("waitMessage")}
                    </p>
                  </motion.div>
                )}

                {/* ─── CALLED: Go to Counter ─── */}
                {isCalled && (
                  <motion.div
                    key="called"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-primary/12 via-accent-primary/5 to-surface-secondary p-6 border border-accent-primary/20">
                      <div className="absolute top-3 right-3">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Sparkles
                            size={20}
                            className="text-accent-primary/40"
                          />
                        </motion.div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <motion.div
                          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/15 shadow-glow"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Monitor size={28} className="text-accent-primary" />
                        </motion.div>
                        <p className="text-lg font-bold text-content-primary">
                          {t("calledMessage", {
                            counter: ticket.counterName || "—",
                          })}
                        </p>
                        <p className="mt-2 text-sm text-content-tertiary">
                          {t("approachingMessage")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── SERVING ─── */}
                {isServing && (
                  <motion.div
                    key="serving"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-surface-secondary to-surface-secondary p-6 border border-emerald-500/15">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                          <ArrowRight size={28} className="text-emerald-500" />
                        </div>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {t("serving")}
                        </p>
                        {ticket.counterName && (
                          <p className="mt-1 text-sm text-content-tertiary">
                            {t("calledMessage", {
                              counter: ticket.counterName,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── DONE ─── */}
                {isDone && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/8 via-surface-secondary to-surface-secondary p-6 border border-emerald-500/10">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                          <CheckCircle2
                            size={28}
                            className="text-emerald-500"
                          />
                        </div>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {t("done")}
                        </p>
                        <p className="mt-1 text-sm text-content-tertiary">
                          Thank you for your visit
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── SKIPPED ─── */}
                {isSkipped && (
                  <motion.div
                    key="skipped"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/8 via-surface-secondary to-surface-secondary p-6 border border-red-500/10">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                          <XCircle size={28} className="text-red-500" />
                        </div>
                        <p className="text-lg font-bold text-red-500">
                          {t("skipped")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ─── Footer ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-content-tertiary/50">
            Powered by{" "}
            <span className="font-semibold text-accent-primary/60">
              QueueFlow
            </span>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
