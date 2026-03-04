"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  UserCheck,
  SkipForward,
  Phone,
  PlayCircle,
  CheckCircle2,
  Ticket,
  Loader2,
  Trophy,
  Clock,
  Users,
  Zap,
  ArrowRightLeft,
  LogOut,
  Keyboard,
  History,
  Timer,
  ChevronRight,
  Activity,
  Pause,
  Play,
  Coffee,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { api } from "../../../../../lib/api";
import { useStaffStore } from "../../../../../lib/store";
import { useSocket } from "../../../../../lib/hooks/use-socket";
import { useRouter } from "../../../../../i18n/navigation";

// ─── Service Timer Hook ───
function useServiceTimer(isServing: boolean) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isServing) {
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      setSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isServing]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return {
    seconds,
    display: `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
    isWarning: seconds > 300,
    isCritical: seconds > 600,
  };
}

// ─── Live Clock ───
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-sm tabular-nums text-content-secondary">
      {time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

export default function StaffCounterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: counterId } = use(params);
  const t = useTranslations("staffCounter");
  const router = useRouter();

  // Staff-only session — completely separate from admin auth
  const staffToken = useStaffStore((s) => s.token);
  const staffUser = useStaffStore((s) => s.staff);
  const clearStaffAuth = useStaffStore((s) => s.clearStaffAuth);
  const isStaffAuthenticated = useStaffStore((s) => s.isStaffAuthenticated);

  // Redirect to staff login if not authenticated
  useEffect(() => {
    if (!isStaffAuthenticated()) {
      router.push("/staff/login");
    }
  }, [staffToken, isStaffAuthenticated, router]);

  const { joinCounter, onEvent } = useSocket();
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [counter, setCounter] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [servedCount, setServedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [onBreak, setOnBreak] = useState(false);
  const [queueStats, setQueueStats] = useState<{
    waiting: number;
    serving: number;
  }>({ waiting: 0, serving: 0 });

  const isServing = currentTicket?.status === "SERVING";
  const timer = useServiceTimer(isServing);

  // Load counter info via staff session
  useEffect(() => {
    if (!staffToken) return;
    api.staffCounter.get(counterId).then(setCounter).catch(console.error);
  }, [counterId, staffToken]);

  // Join socket room
  useEffect(() => {
    if (staffUser?.tenantId && staffUser?.branchId) {
      joinCounter(staffUser.tenantId, staffUser.branchId, counterId);
    }
  }, [staffUser, counterId, joinCounter]);

  // Socket events
  useEffect(() => {
    const unsub1 = onEvent("counterUpdate", (data: any) => {
      if (data.counterId === counterId) {
        setCurrentTicket(data.currentTicket || null);
        if (data.queueStats) setQueueStats(data.queueStats);
      }
    });
    const unsub2 = onEvent("queueUpdate", (data: any) => {
      if (data.waitingCount !== undefined) {
        setQueueStats((prev) => ({
          ...prev,
          waiting: data.waitingCount,
        }));
      }
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [counterId, onEvent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const key = e.key.toLowerCase();
      if (key === "n" && !currentTicket) performAction("next");
      else if (key === "s" && currentTicket?.status === "CALLED")
        performAction("start");
      else if (key === "d" && currentTicket?.status === "SERVING")
        performAction("done");
      else if (key === "k" && currentTicket?.status === "CALLED")
        performAction("skip");
      else if (key === "r" && currentTicket?.status === "CALLED")
        performAction("recall");
      else if (key === "?" || (e.shiftKey && key === "/"))
        setShowShortcuts((v) => !v);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentTicket]);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, [soundEnabled]);

  const performAction = useCallback(
    async (action: string) => {
      if (!staffToken || loading) return;
      setLoading(action);
      try {
        const actions: Record<string, () => Promise<any>> = {
          next: () => api.staffCounter.next(counterId),
          recall: () => api.staffCounter.recall(counterId),
          skip: () => api.staffCounter.skip(counterId),
          start: () => api.staffCounter.startServing(counterId),
          done: () => api.staffCounter.done(counterId),
        };
        const result = await actions[action]!();
        if (action === "next" || action === "recall") {
          setCurrentTicket(result);
          playSound();
        } else if (action === "done" || action === "skip") {
          const prev = currentTicket;
          setCurrentTicket(null);
          if (action === "done") {
            setServedCount((c) => c + 1);
            if (prev) {
              setHistory((h) => [
                {
                  ticket: prev.displayNumber,
                  action: "done",
                  time: new Date(),
                },
                ...h.slice(0, 9),
              ]);
            }
          }
          if (action === "skip") {
            setSkippedCount((c) => c + 1);
            if (prev) {
              setHistory((h) => [
                {
                  ticket: prev.displayNumber,
                  action: "skip",
                  time: new Date(),
                },
                ...h.slice(0, 9),
              ]);
            }
          }
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(null);
      }
    },
    [counterId, staffToken, loading, currentTicket, playSound],
  );

  const handleTransfer = useCallback(
    async (targetQueueId: string) => {
      if (!staffToken) return;
      setLoading("transfer");
      try {
        await api.staffCounter.transfer(counterId, targetQueueId);
        setCurrentTicket(null);
        setShowTransfer(false);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(null);
      }
    },
    [counterId, staffToken],
  );

  const handleLogout = () => {
    clearStaffAuth();
    router.push("/staff/login");
  };

  const employeeName = staffUser
    ? `${staffUser.firstName} ${staffUser.lastName}`
    : "";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-primary">
      {/* ─── Top Bar ─── */}
      <header className="glass relative z-20 flex items-center justify-between border-b border-surface-tertiary/50 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-glow">
            <Monitor size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-content-primary">
              {counter?.name || t("title")}
              {counter?.counterNumber && (
                <span className="ml-2 text-sm text-accent-primary">
                  #{counter.counterNumber}
                </span>
              )}
            </h1>
            <p className="text-xs text-content-tertiary">{employeeName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LiveClock />
          <div className="h-5 w-px bg-surface-tertiary" />

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-lg p-2 text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary"
            title={soundEnabled ? t("muteSound") : t("enableSound")}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => setShowShortcuts(true)}
            className="rounded-lg p-2 text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary"
            title={t("shortcuts")}
          >
            <Keyboard size={16} />
          </button>

          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-content-tertiary transition-colors hover:bg-status-error/10 hover:text-status-error"
            title={t("logout")}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Stats */}
        <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-surface-tertiary/50 bg-surface-secondary/30 p-5 lg:flex">
          {/* Shift stats */}
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-tertiary">
              <Activity size={12} />
              {t("shiftStats")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-elevated p-3">
                <div className="mb-1 text-2xl font-black text-accent-primary">
                  {servedCount}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                  {t("served")}
                </div>
              </div>
              <div className="rounded-xl bg-surface-elevated p-3">
                <div className="mb-1 text-2xl font-black text-status-warning">
                  {skippedCount}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                  {t("skipped")}
                </div>
              </div>
            </div>
          </div>

          {/* Queue info */}
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-tertiary">
              <Users size={12} />
              {t("queueInfo")}
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-surface-elevated p-3">
                <span className="text-xs font-medium text-content-secondary">
                  {t("waiting")}
                </span>
                <span className="text-lg font-bold text-content-primary">
                  {queueStats.waiting}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-elevated p-3">
                <span className="text-xs font-medium text-content-secondary">
                  {t("beingServed")}
                </span>
                <span className="text-lg font-bold text-content-primary">
                  {queueStats.serving}
                </span>
              </div>
            </div>
          </div>

          {/* Service Timer */}
          {isServing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-tertiary">
                <Timer size={12} />
                {t("serviceTime")}
              </h2>
              <div
                className={`rounded-xl p-4 text-center ${
                  timer.isCritical
                    ? "bg-status-error/10 ring-1 ring-status-error/30"
                    : timer.isWarning
                      ? "bg-status-warning/10 ring-1 ring-status-warning/30"
                      : "bg-surface-elevated"
                }`}
              >
                <div
                  className={`font-mono text-3xl font-black ${
                    timer.isCritical
                      ? "text-status-error"
                      : timer.isWarning
                        ? "text-status-warning"
                        : "text-content-primary"
                  }`}
                >
                  {timer.display}
                </div>
                {timer.isWarning && (
                  <p className="mt-1 text-[10px] font-medium text-status-warning">
                    {t("longService")}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Break toggle */}
          <div className="mt-auto">
            <button
              onClick={() => setOnBreak(!onBreak)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                onBreak
                  ? "bg-status-warning/10 text-status-warning ring-1 ring-status-warning/30"
                  : "bg-surface-elevated text-content-secondary hover:bg-surface-tertiary"
              }`}
            >
              {onBreak ? <Play size={16} /> : <Coffee size={16} />}
              {onBreak ? t("resumeWork") : t("takeBreak")}
            </button>
          </div>
        </aside>

        {/* Center — Main Action Area */}
        <main className="relative flex flex-1 flex-col items-center justify-center p-8">
          {/* Subtle background pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(circle, var(--accent-primary) 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Break overlay */}
          <AnimatePresence>
            {onBreak && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-primary/90 backdrop-blur-sm"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Coffee size={48} className="mb-4 text-status-warning" />
                </motion.div>
                <h2 className="mb-2 text-2xl font-bold text-content-primary">
                  {t("onBreak")}
                </h2>
                <p className="mb-6 text-content-secondary">
                  {t("breakMessage")}
                </p>
                <button
                  onClick={() => setOnBreak(false)}
                  className="btn-primary"
                >
                  <Play size={16} />
                  {t("resumeWork")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Ticket Display */}
          <div className="relative z-0 w-full max-w-xl">
            <motion.div layout className="mb-10 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-content-tertiary">
                {t("currentTicket")}
              </p>
              <AnimatePresence mode="wait">
                {currentTicket ? (
                  <motion.div
                    key={currentTicket.displayNumber}
                    initial={{ opacity: 0, scale: 0.7, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <h2 className="gradient-text text-[7rem] font-black leading-none tracking-wider sm:text-[9rem]">
                      {currentTicket.displayNumber}
                    </h2>
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="mt-4"
                    >
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
                          currentTicket.status === "CALLED"
                            ? "bg-accent-primary/10 text-accent-primary"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        <span className="relative flex h-2 w-2">
                          <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                              currentTicket.status === "CALLED"
                                ? "bg-accent-primary"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span
                            className={`relative inline-flex h-2 w-2 rounded-full ${
                              currentTicket.status === "CALLED"
                                ? "bg-accent-primary"
                                : "bg-emerald-500"
                            }`}
                          />
                        </span>
                        {currentTicket.status === "CALLED"
                          ? t("statusCalled")
                          : t("statusServing")}
                      </span>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8"
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Ticket
                        size={56}
                        className="mx-auto mb-4 text-content-tertiary/25"
                      />
                    </motion.div>
                    <p className="text-xl font-medium text-content-tertiary">
                      {t("noTicket")}
                    </p>
                    <p className="mt-1 text-sm text-content-tertiary/60">
                      {t("pressNext")}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action Buttons */}
            <motion.div layout className="grid gap-3 sm:grid-cols-2">
              {!currentTicket ? (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => performAction("next")}
                  disabled={!!loading || onBreak}
                  className="group col-span-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary px-8 py-6 text-xl font-black text-white shadow-glow transition-all hover:shadow-glow-strong disabled:opacity-50 sm:col-span-2"
                >
                  {loading === "next" ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <UserCheck size={24} />
                  )}
                  {t("callNext")}
                  <kbd className="ml-2 hidden rounded bg-white/20 px-2 py-0.5 text-xs font-medium sm:inline">
                    N
                  </kbd>
                </motion.button>
              ) : (
                <>
                  {currentTicket.status === "CALLED" && (
                    <>
                      <ActionBtn
                        action="start"
                        icon={PlayCircle}
                        label={t("startServing")}
                        shortcut="S"
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                        loading={loading}
                        onAction={performAction}
                      />
                      <ActionBtn
                        action="recall"
                        icon={Phone}
                        label={t("recall")}
                        shortcut="R"
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                        loading={loading}
                        onAction={performAction}
                      />
                      <ActionBtn
                        action="skip"
                        icon={SkipForward}
                        label={t("skip")}
                        shortcut="K"
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        loading={loading}
                        onAction={performAction}
                        fullWidth
                      />
                    </>
                  )}
                  {currentTicket.status === "SERVING" && (
                    <>
                      <ActionBtn
                        action="done"
                        icon={CheckCircle2}
                        label={t("complete")}
                        shortcut="D"
                        className="bg-gradient-to-r from-accent-primary to-accent-secondary shadow-glow hover:shadow-glow-strong"
                        loading={loading}
                        onAction={performAction}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowTransfer(true)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-surface-tertiary px-6 py-4 text-base font-bold text-content-primary transition-all hover:bg-surface-tertiary/80"
                      >
                        <ArrowRightLeft size={18} />
                        {t("transfer")}
                      </motion.button>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </main>

        {/* Right Panel — History */}
        <aside className="hidden w-72 flex-shrink-0 flex-col border-l border-surface-tertiary/50 bg-surface-secondary/30 p-5 xl:flex">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-tertiary">
            <History size={12} />
            {t("recentHistory")}
          </h2>

          {history.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <History size={32} className="mb-3 text-content-tertiary/25" />
              <p className="text-sm text-content-tertiary">{t("noHistory")}</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              <AnimatePresence initial={false}>
                {history.map((item, i) => (
                  <motion.div
                    key={`${item.ticket}-${item.time.getTime()}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-xl bg-surface-elevated p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          item.action === "done"
                            ? "bg-status-success/10 text-status-success"
                            : "bg-status-warning/10 text-status-warning"
                        }`}
                      >
                        {item.action === "done" ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <SkipForward size={14} />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-content-primary">
                          {item.ticket}
                        </span>
                        <p className="text-[10px] text-content-tertiary">
                          {item.action === "done"
                            ? t("completed")
                            : t("skippedAction")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] tabular-nums text-content-tertiary">
                      {item.time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Assigned queues */}
          {counter?.queueIds?.length > 0 && (
            <div className="mt-auto pt-4">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-tertiary">
                <Zap size={12} />
                {t("assignedQueues")}
              </h2>
              <div className="space-y-1.5">
                {counter.queueIds.map((q: any) => (
                  <div
                    key={q._id || q}
                    className="flex items-center gap-2 rounded-lg bg-surface-elevated px-3 py-2 text-xs font-medium text-content-secondary"
                  >
                    <ChevronRight size={12} className="text-accent-primary" />
                    {q.name || q}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─── Transfer Modal ─── */}
      <AnimatePresence>
        {showTransfer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowTransfer(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-surface-elevated p-6 shadow-large"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-content-primary">
                  {t("transferTicket")}
                </h3>
                <button
                  onClick={() => setShowTransfer(false)}
                  className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mb-4 text-sm text-content-secondary">
                {t("transferDesc")}
              </p>
              <div className="space-y-2">
                {counter?.queueIds
                  ?.filter((q: any) => q._id)
                  .map((q: any) => (
                    <button
                      key={q._id}
                      onClick={() => handleTransfer(q._id)}
                      disabled={!!loading}
                      className="flex w-full items-center justify-between rounded-xl bg-surface-secondary px-4 py-3 text-left transition-all hover:bg-surface-tertiary"
                    >
                      <span className="text-sm font-semibold text-content-primary">
                        {q.name}
                      </span>
                      {loading === "transfer" ? (
                        <Loader2
                          size={14}
                          className="animate-spin text-content-tertiary"
                        />
                      ) : (
                        <ArrowRightLeft
                          size={14}
                          className="text-content-tertiary"
                        />
                      )}
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Keyboard Shortcuts Modal ─── */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-surface-elevated p-6 shadow-large"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-content-primary">
                  {t("keyboardShortcuts")}
                </h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "N", desc: t("callNext") },
                  { key: "S", desc: t("startServing") },
                  { key: "D", desc: t("complete") },
                  { key: "K", desc: t("skip") },
                  { key: "R", desc: t("recall") },
                  { key: "?", desc: t("shortcuts") },
                ].map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-content-secondary">
                      {shortcut.desc}
                    </span>
                    <kbd className="rounded-lg bg-surface-secondary px-3 py-1.5 font-mono text-xs font-bold text-content-primary">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Action Button Component ───
function ActionBtn({
  action,
  icon: Icon,
  label,
  shortcut,
  className,
  loading,
  onAction,
  fullWidth,
}: {
  action: string;
  icon: any;
  label: string;
  shortcut: string;
  className: string;
  loading: string | null;
  onAction: (a: string) => void;
  fullWidth?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAction(action)}
      disabled={!!loading}
      className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white transition-all disabled:opacity-50 ${className} ${fullWidth ? "sm:col-span-2" : ""}`}
    >
      {loading === action ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Icon size={18} />
      )}
      {label}
      <kbd className="ml-1 hidden rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium sm:inline">
        {shortcut}
      </kbd>
    </motion.button>
  );
}
