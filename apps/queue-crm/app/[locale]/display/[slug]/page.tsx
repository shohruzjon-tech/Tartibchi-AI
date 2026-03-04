"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Clock,
  Zap,
  Users,
  Timer,
  ArrowRight,
  Wifi,
  WifiOff,
  Volume2,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useSocket } from "../../../../lib/hooks/use-socket";
import { api } from "../../../../lib/api";

/* ───── Types ───── */
interface Branch {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  address?: string;
  isActive: boolean;
}

interface DisplayTicket {
  displayNumber: string;
  counterName: string;
  status: string;
  queueName?: string;
}

interface QueueInfo {
  _id: string;
  name: string;
  prefix: string;
  waitingCount?: number;
  avgServiceTime?: number;
  isActive: boolean;
}

interface CounterInfo {
  _id: string;
  name: string;
  number: number;
  status: string;
  currentTicket?: string;
  isActive: boolean;
}

/* ───── Notification Sound ───── */
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + dur,
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    playTone(880, 0, 0.3);
    playTone(1174.66, 0.15, 0.4);
    playTone(1318.51, 0.35, 0.5);
  } catch {
    // Audio not available
  }
}

/* ───── Ease curves ───── */
const smoothSpring = { type: "spring" as const, stiffness: 280, damping: 28 };
const gentleEase = [0.22, 1, 0.36, 1] as const;

/* ═══════════════════════════════════════════════════════
   Display Page — Light Mode with Slug
   ═══════════════════════════════════════════════════════ */
export default function DisplayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("display");

  /* ─── State ─── */
  const [branch, setBranch] = useState<Branch | null>(null);
  const [calledTickets, setCalledTickets] = useState<DisplayTicket[]>([]);
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [counters, setCounters] = useState<CounterInfo[]>([]);
  const [time, setTime] = useState(new Date());
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashTicket, setFlashTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { joinDisplay, joinBranch, onEvent, socket } = useSocket();

  /* ─── Fetch branch by slug, then queues & counters ─── */
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const branchData = await api.branches.getBySlug(slug);
      if (!branchData || !branchData.isActive) {
        setError(true);
        setLoading(false);
        return;
      }
      setBranch(branchData);

      const [queueData, counterData] = await Promise.allSettled([
        api.queues.list({
          tenantId: branchData.tenantId,
          branchId: branchData._id,
        }),
        api.counters.list(
          { tenantId: branchData.tenantId, branchId: branchData._id },
          "",
        ),
      ]);

      if (queueData.status === "fulfilled") {
        setQueues(Array.isArray(queueData.value) ? queueData.value : []);
      }
      if (counterData.status === "fulfilled") {
        setCounters(Array.isArray(counterData.value) ? counterData.value : []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  /* ─── WebSocket — join after branch is resolved ─── */
  useEffect(() => {
    if (!branch) return;
    joinDisplay(branch.tenantId, branch._id);
    joinBranch(branch.tenantId, branch._id);
  }, [branch, joinDisplay, joinBranch]);

  useEffect(() => {
    const s = socket;
    if (!s) return;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    if (s.connected) setConnected(true);
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    if (!branch) return;
    const unsub = onEvent("displayUpdate", (data: any) => {
      if (data.branchId === branch._id) {
        setCalledTickets(data.calledTickets || []);
      }
    });
    return unsub;
  }, [branch, onEvent]);

  useEffect(() => {
    const unsub = onEvent("ticketCalled", (data: any) => {
      const newTicket: DisplayTicket = {
        displayNumber: data.displayNumber,
        counterName: data.counterName,
        status: "CALLED",
        queueName: data.queueName,
      };
      setCalledTickets((prev) => {
        const updated = [
          newTicket,
          ...prev.filter((tk) => tk.displayNumber !== data.displayNumber),
        ];
        return updated.slice(0, 12);
      });
      setFlashTicket(data.displayNumber);
      setTimeout(() => setFlashTicket(null), 3000);
      if (soundEnabled) playNotificationSound();
    });
    return unsub;
  }, [onEvent, soundEnabled]);

  useEffect(() => {
    if (!branch) return;
    const unsub1 = onEvent("queueUpdate", (data: any) => {
      if (data.branchId === branch._id) {
        setQueues((prev) =>
          prev.map((q) =>
            q._id === data.queueId
              ? {
                  ...q,
                  waitingCount: data.waitingCount ?? q.waitingCount,
                  avgServiceTime: data.avgServiceTime ?? q.avgServiceTime,
                }
              : q,
          ),
        );
      }
    });
    const unsub2 = onEvent("counterUpdate", (data: any) => {
      if (data.branchId === branch._id) {
        setCounters((prev) =>
          prev.map((c) =>
            c._id === data.counterId
              ? {
                  ...c,
                  status: data.status ?? c.status,
                  currentTicket: data.currentTicket ?? c.currentTicket,
                }
              : c,
          ),
        );
      }
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [branch, onEvent]);

  /* ─── Clock ─── */
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Derived ─── */
  const activeQueues = queues.filter((q) => q.isActive);
  const totalWaiting = activeQueues.reduce(
    (sum, q) => sum + (q.waitingCount || 0),
    0,
  );
  const activeCounters = counters.filter((c) => c.isActive);
  const servingCounters = counters.filter(
    (c) => c.status === "SERVING" || c.currentTicket,
  );

  const latestTicket = calledTickets[0];
  const previousTickets = calledTickets.slice(1, 7);

  /* ═══════ Loading ═══════ */
  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-[3px] border-emerald-100" />
            <motion.div
              className="absolute inset-0 h-14 w-14 rounded-full border-[3px] border-transparent border-t-emerald-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-sm font-medium text-gray-400">Loading display…</p>
        </motion.div>
      </div>
    );
  }

  /* ═══════ Error ═══════ */
  if (error || !branch) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50/30 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm rounded-3xl bg-white p-10 text-center shadow-xl shadow-gray-200/50"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Branch not found</h2>
          <p className="mt-2 text-sm text-gray-500">
            This branch doesn't exist or is currently inactive.
          </p>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     Render — Light Mode
     ═══════════════════════════════════════ */
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 text-gray-900 selection:bg-emerald-500/20">
      {/* ── Ambient light blobs ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-400/[0.06] blur-[150px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-teal-300/[0.05] blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-200/[0.04] blur-[120px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* ══════════════════════════════════
         Header
         ══════════════════════════════════ */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-10 lg:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              {branch.name}
            </span>
            <p className="text-[11px] font-medium text-gray-400">
              {t("title")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            {connected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {t("live")}
                </span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-red-400" />
                <span className="text-xs font-semibold text-red-500">
                  {t("offline")}
                </span>
              </>
            )}
          </div>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-sm transition-all ${
              soundEnabled
                ? "bg-white/70 text-gray-600 hover:bg-white"
                : "bg-gray-100/70 text-gray-400"
            }`}
          >
            <Volume2 size={13} />
            {soundEnabled ? "ON" : "OFF"}
          </button>

          {/* Clock */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/70 px-5 py-2.5 shadow-sm backdrop-blur-sm">
            <Clock size={14} className="text-emerald-500" />
            <span className="font-mono text-sm font-bold tabular-nums text-gray-700">
              {time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className="text-xs font-medium text-gray-400">
              {time.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════
         Stats Ribbon
         ══════════════════════════════════ */}
      <div className="relative z-10 mx-6 mb-4 grid grid-cols-4 gap-3 lg:mx-10">
        <StatCard
          icon={<Users size={16} />}
          label={t("waitingInLine")}
          value={totalWaiting}
          color="amber"
          pulse={totalWaiting > 0}
        />
        <StatCard
          icon={<Activity size={16} />}
          label={t("activeQueues")}
          value={activeQueues.length}
          color="emerald"
        />
        <StatCard
          icon={<Monitor size={16} />}
          label={t("openCounters")}
          value={activeCounters.length}
          color="sky"
        />
        <StatCard
          icon={<Timer size={16} />}
          label={t("nowServingCount")}
          value={servingCounters.length}
          color="violet"
        />
      </div>

      {/* ══════════════════════════════════
         Main — Two Columns
         ══════════════════════════════════ */}
      <main className="relative z-10 flex flex-1 gap-5 px-6 pb-6 lg:px-10 lg:pb-8">
        {/* ── LEFT: Now Serving ── */}
        <div className="flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            {latestTicket ? (
              <motion.div
                key={latestTicket.displayNumber}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -12 }}
                transition={smoothSpring}
                className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-white/60 shadow-xl shadow-gray-200/40 backdrop-blur-md"
                style={{
                  border: "1px solid rgba(16,185,129,0.12)",
                }}
              >
                {/* Flash overlay on new ticket */}
                <AnimatePresence>
                  {flashTicket === latestTicket.displayNumber && (
                    <motion.div
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2.5 }}
                      className="absolute inset-0 bg-gradient-to-br from-emerald-400/15 via-emerald-300/8 to-transparent"
                    />
                  )}
                </AnimatePresence>

                {/* Decorative rings */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="h-[350px] w-[350px] rounded-full border border-emerald-500/[0.04]"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute h-[500px] w-[500px] rounded-full border border-emerald-400/[0.03]"
                    animate={{ scale: [1, 1.015, 1] }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                  />
                </div>

                {/* Dot grid */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.02]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.5) 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                />

                <div className="relative z-10 text-center">
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, ease: gentleEase }}
                    className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-emerald-600/70"
                  >
                    {t("nowServing")}
                  </motion.p>

                  <motion.h2
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...smoothSpring, delay: 0.12 }}
                    className="mb-6 text-[8rem] font-black leading-none tracking-wider text-gray-900 lg:text-[10rem]"
                    style={{
                      textShadow: "0 4px 30px rgba(16,185,129,0.12)",
                    }}
                  >
                    {latestTicket.displayNumber}
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, ease: gentleEase }}
                    className="flex items-center justify-center gap-3"
                  >
                    <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-2.5 shadow-sm">
                      <Monitor size={16} className="text-emerald-500" />
                      <span className="text-base font-bold text-emerald-700">
                        {t("counter")} {latestTicket.counterName}
                      </span>
                    </div>
                    {latestTicket.queueName && (
                      <div className="flex items-center gap-2 rounded-2xl bg-gray-100/70 px-4 py-2.5">
                        <span className="text-sm font-semibold text-gray-500">
                          {latestTicket.queueName}
                        </span>
                      </div>
                    )}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute bottom-6 right-6 flex items-center gap-2 text-gray-300"
                >
                  <ArrowRight size={18} />
                  <span className="text-xs font-bold uppercase tracking-[0.15em]">
                    {t("goToCounter")}
                  </span>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center rounded-[2rem] bg-white/40 shadow-lg shadow-gray-100/30 backdrop-blur-sm"
                style={{ border: "1px solid rgba(0,0,0,0.04)" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100"
                >
                  <Clock size={36} className="text-gray-300" />
                </motion.div>
                <p className="text-xl font-bold text-gray-400">
                  {t("pleaseWait")}
                </p>
                <p className="mt-2 text-sm text-gray-300">{t("waitingDesc")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="flex w-[340px] shrink-0 flex-col gap-4 lg:w-[380px]">
          {/* Recent calls */}
          <div
            className="rounded-2xl bg-white/60 p-4 shadow-lg shadow-gray-100/30 backdrop-blur-sm"
            style={{ border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              {t("recentCalls")}
            </h3>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {previousTickets.length > 0 ? (
                  previousTickets.map((ticket, idx) => (
                    <motion.div
                      key={ticket.displayNumber}
                      layout
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{
                        delay: idx * 0.04,
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                        idx === 0
                          ? "bg-emerald-50/80 shadow-sm"
                          : "bg-gray-50/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-lg font-bold tabular-nums ${
                            idx === 0 ? "text-gray-800" : "text-gray-500"
                          }`}
                        >
                          {ticket.displayNumber}
                        </span>
                        {ticket.queueName && (
                          <span className="text-xs font-medium text-gray-400">
                            {ticket.queueName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <Monitor size={11} />
                        {ticket.counterName}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="py-6 text-center text-xs font-medium text-gray-300">
                    {t("noPreviousCalls")}
                  </p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active queues */}
          {activeQueues.length > 0 && (
            <div
              className="rounded-2xl bg-white/60 p-4 shadow-lg shadow-gray-100/30 backdrop-blur-sm"
              style={{ border: "1px solid rgba(0,0,0,0.05)" }}
            >
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {t("activeQueues")}
              </h3>
              <div className="space-y-2">
                {activeQueues.map((queue, idx) => (
                  <motion.div
                    key={queue._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, ease: gentleEase }}
                    className="flex items-center justify-between rounded-xl bg-gray-50/80 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-extrabold text-emerald-600">
                        {queue.prefix}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {queue.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(queue.waitingCount ?? 0) > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">
                          <Users size={11} />
                          {queue.waitingCount}
                        </span>
                      )}
                      {(queue.avgServiceTime ?? 0) > 0 && (
                        <span className="text-xs font-medium text-gray-400">
                          ~{Math.round((queue.avgServiceTime || 0) / 60)}m
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Counter status */}
          {activeCounters.length > 0 && (
            <div
              className="flex-1 rounded-2xl bg-white/60 p-4 shadow-lg shadow-gray-100/30 backdrop-blur-sm"
              style={{ border: "1px solid rgba(0,0,0,0.05)" }}
            >
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {t("counterStatus")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {activeCounters.map((counter, idx) => {
                  const isServing =
                    counter.status === "SERVING" || counter.currentTicket;
                  return (
                    <motion.div
                      key={counter._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04, ...smoothSpring }}
                      className={`rounded-xl px-3 py-3 text-center transition-all ${
                        isServing
                          ? "bg-emerald-50 ring-1 ring-emerald-200 shadow-sm"
                          : "bg-gray-50/80"
                      }`}
                    >
                      <div
                        className={`text-xs font-bold ${
                          isServing ? "text-emerald-600" : "text-gray-400"
                        }`}
                      >
                        {counter.name || `#${counter.number}`}
                      </div>
                      {counter.currentTicket ? (
                        <div className="mt-0.5 text-sm font-extrabold text-gray-800">
                          {counter.currentTicket}
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[11px] font-medium text-gray-300">
                          {t("available")}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══════════════════════════════════
         Footer
         ══════════════════════════════════ */}
      <footer className="relative z-10 flex items-center justify-between px-6 py-3 lg:px-10">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
          <Zap size={10} />
          <span>
            Powered by{" "}
            <span className="font-bold text-emerald-500/70">QueueFlow</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? "bg-emerald-500 animate-pulse" : "bg-red-400"
            }`}
          />
          <span>{connected ? t("realTimeActive") : t("reconnecting")}</span>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Stat Card — Light Mode
   ═══════════════════════════════════════════════════════ */
const COLOR_MAP: Record<
  string,
  { bg: string; icon: string; value: string; pulse: string }
> = {
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-500",
    value: "text-amber-600",
    pulse: "bg-amber-400",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
    value: "text-emerald-600",
    pulse: "bg-emerald-400",
  },
  sky: {
    bg: "bg-sky-50",
    icon: "text-sky-500",
    value: "text-sky-600",
    pulse: "bg-sky-400",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-500",
    value: "text-violet-600",
    pulse: "bg-violet-400",
  },
};

function StatCard({
  icon,
  label,
  value,
  color,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  pulse?: boolean;
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.emerald;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: gentleEase }}
      className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3.5 shadow-sm backdrop-blur-sm"
      style={{ border: "1px solid rgba(0,0,0,0.04)" }}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.icon}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-xl font-extrabold tabular-nums ${c.value}`}>
            {value}
          </span>
          {pulse && (
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full ${c.pulse} opacity-60`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${c.pulse}`}
              />
            </span>
          )}
        </div>
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </p>
      </div>
    </motion.div>
  );
}
