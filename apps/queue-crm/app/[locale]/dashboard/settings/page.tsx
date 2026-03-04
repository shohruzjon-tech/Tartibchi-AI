"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Plug,
  Unplug,
  CheckCircle2,
  User,
  Users,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Scissors,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Wrench,
  Store,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Link2,
  UserCheck,
  Clock,
  Activity,
  X,
  Calendar,
  Settings2,
  Timer,
} from "lucide-react";
import { api } from "../../../../lib/api";
import { useAuthStore } from "../../../../lib/store";

/* ─── Constants ─── */
const BUSINESS_TYPES = [
  { key: "barber", icon: Scissors, color: "from-violet-500 to-purple-600" },
  { key: "medical", icon: Stethoscope, color: "from-emerald-500 to-teal-600" },
  { key: "consulting", icon: Briefcase, color: "from-blue-500 to-indigo-600" },
  {
    key: "education",
    icon: GraduationCap,
    color: "from-amber-500 to-orange-600",
  },
  { key: "repair", icon: Wrench, color: "from-rose-500 to-pink-600" },
  { key: "retail", icon: Store, color: "from-cyan-500 to-sky-600" },
];

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const TABS = [
  { key: "workType", icon: Settings2 },
  { key: "telegram", icon: Bot },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ─── Hook: responsive breakpoint ─── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/* ─── Overlay: Drawer (mobile) or Modal (desktop) ─── */
function Overlay({
  open,
  onClose,
  title,
  children,
  isMobile,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isMobile: boolean;
}) {
  if (!open) return null;

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-surface-elevated shadow-xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-primary/10 bg-surface-elevated px-5 py-4">
                <h3 className="text-base font-semibold text-content-primary">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 hover:bg-surface-secondary"
                >
                  <X size={18} className="text-content-tertiary" />
                </button>
              </div>
              <div className="w-full p-1">
                <div className="mx-auto h-1 w-10 rounded-full bg-content-tertiary/20 mb-2" />
              </div>
              <div className="px-5 pb-8">{children}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <div
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-surface-elevated shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-primary/10 bg-surface-elevated px-6 py-4">
                <h3 className="text-base font-semibold text-content-primary">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 hover:bg-surface-secondary"
                >
                  <X size={18} className="text-content-tertiary" />
                </button>
              </div>
              <div className="px-6 py-5">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Settings Page
   ═══════════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const to = useTranslations("onboarding");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<TabKey>("workType");

  /* ─── Work Type / Mode Switch ─── */
  const [showModeEditor, setShowModeEditor] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<"SOLO" | "MULTI" | null>(
    null,
  );
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [switchSuccess, setSwitchSuccess] = useState(false);

  // Solo profile fields
  const [businessType, setBusinessType] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [workingHours, setWorkingHours] = useState<
    Record<string, { start: string; end: string; closed: boolean }>
  >(() => {
    const defaults: Record<
      string,
      { start: string; end: string; closed: boolean }
    > = {};
    DAYS.forEach((d) => {
      defaults[d] = { start: "09:00", end: "18:00", closed: d === "sunday" };
    });
    return defaults;
  });

  // Multi timeframe fields
  const [multiWorkingHours, setMultiWorkingHours] = useState<
    Record<string, { start: string; end: string; closed: boolean }>
  >(() => {
    const defaults: Record<
      string,
      { start: string; end: string; closed: boolean }
    > = {};
    DAYS.forEach((d) => {
      defaults[d] = { start: "09:00", end: "18:00", closed: d === "sunday" };
    });
    return defaults;
  });

  /* ─── Average Service Time ─── */
  const [avgServiceTime, setAvgServiceTime] = useState(15);
  const [avgSaving, setAvgSaving] = useState(false);
  const [avgSaved, setAvgSaved] = useState(false);

  /* ─── Schedule saving (solo) ─── */
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // Load tenant data to populate solo profile & avgServiceTime
  useEffect(() => {
    if (!token || !user?.tenantId) return;
    api.tenants
      .get(user.tenantId, token)
      .then((tenant: any) => {
        if (tenant?.avgServiceTime != null) {
          setAvgServiceTime(tenant.avgServiceTime);
        }
        if (tenant?.soloProfile) {
          const sp = tenant.soloProfile;
          if (sp.businessType) setBusinessType(sp.businessType);
          if (sp.services?.length) setServices(sp.services);
          if (sp.slotDuration) setSlotDuration(sp.slotDuration);
          if (sp.workingHours) {
            setWorkingHours((prev) => {
              const merged = { ...prev };
              for (const day of DAYS) {
                if (sp.workingHours[day]) {
                  merged[day] = {
                    start: sp.workingHours[day].start || "09:00",
                    end: sp.workingHours[day].end || "18:00",
                    closed: sp.workingHours[day].closed || false,
                  };
                }
              }
              return merged;
            });
          }
        }
      })
      .catch(() => {});
  }, [token, user?.tenantId]);

  const saveSoloSchedule = async () => {
    if (!token || !user?.tenantId) return;
    setScheduleSaving(true);
    try {
      await api.tenants.update(
        user.tenantId,
        {
          soloProfile: {
            businessType,
            services,
            slotDuration,
            breakBetweenSlots: 5,
            workingHours,
          },
        },
        token,
      );
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 3000);
    } catch {
      /* noop */
    } finally {
      setScheduleSaving(false);
    }
  };

  const saveAvgServiceTime = async () => {
    if (!token || !user?.tenantId) return;
    setAvgSaving(true);
    try {
      await api.tenants.update(user.tenantId, { avgServiceTime }, token);
      setAvgSaved(true);
      setTimeout(() => setAvgSaved(false), 3000);
    } catch {
      /* noop */
    } finally {
      setAvgSaving(false);
    }
  };

  /* ─── Telegram Bot ─── */
  const [botToken, setBotToken] = useState("");
  const [botStatus, setBotStatus] = useState<any>(null);
  const [botStats, setBotStats] = useState<any>(null);
  const [botLoading, setBotLoading] = useState(true);
  const [botActionLoading, setBotActionLoading] = useState("");
  const [botError, setBotError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSolo = user?.tenantMode === "SOLO";
  const isMulti = user?.tenantMode === "MULTI";

  /* ─── Telegram: load status & stats ─── */
  const loadBotData = useCallback(async () => {
    if (!token) return;
    try {
      const [status, stats] = await Promise.all([
        api.telegram.getBotStatus(token),
        api.telegram.getBotStats(token),
      ]);
      setBotStatus(status);
      setBotStats(stats);
    } catch {
      // silent
    } finally {
      setBotLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBotData();
  }, [loadBotData]);

  // Poll stats every 30s when bot tab is active
  useEffect(() => {
    if (activeTab === "telegram" && botStatus?.isRunning) {
      pollRef.current = setInterval(loadBotData, 30000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeTab, botStatus?.isRunning, loadBotData]);

  /* ─── Telegram actions ─── */
  const connectBot = async () => {
    if (!token || !botToken.trim()) return;
    setBotActionLoading("connect");
    setBotError("");
    try {
      await api.telegram.registerBot(botToken.trim(), token);
      setBotToken("");
      await loadBotData();
    } catch (err: any) {
      setBotError(err.message || "Failed to connect bot");
    } finally {
      setBotActionLoading("");
    }
  };

  const botAction = async (action: "start" | "stop" | "restart" | "delete") => {
    if (!token) return;
    setBotActionLoading(action);
    setBotError("");
    try {
      if (action === "start") await api.telegram.startBot(token);
      else if (action === "stop") await api.telegram.stopBot(token);
      else if (action === "restart") await api.telegram.restartBot(token);
      else if (action === "delete") {
        await api.telegram.deleteBot(token);
        setShowDeleteConfirm(false);
      }
      await loadBotData();
    } catch (err: any) {
      setBotError(err.message || `Failed to ${action} bot`);
    } finally {
      setBotActionLoading("");
    }
  };

  /* ─── Mode switch ─── */
  const openModeEditor = (target: "SOLO" | "MULTI") => {
    setSwitchTarget(target);
    setSwitchError("");
    setSwitchSuccess(false);
    setShowModeEditor(true);
  };

  const handleSwitchMode = async () => {
    if (!token || !switchTarget) return;
    setSwitching(true);
    setSwitchError("");
    try {
      const payload: any = { mode: switchTarget };
      if (switchTarget === "SOLO") {
        payload.soloProfile = {
          businessType,
          services,
          slotDuration,
          breakBetweenSlots: 5,
          workingHours,
        };
      }
      if (switchTarget === "MULTI") {
        payload.workingHours = multiWorkingHours;
      }
      await api.tenants.switchMode(payload, token);
      const refreshData = await api.auth.refresh(
        useAuthStore.getState().refreshToken!,
      );
      setAuth(refreshData);
      setSwitchSuccess(true);
      setShowModeEditor(false);
      setTimeout(() => setSwitchSuccess(false), 3000);
    } catch (err: any) {
      setSwitchError(err.message || "Failed to switch mode");
    } finally {
      setSwitching(false);
    }
  };

  const addService = () => {
    const trimmed = serviceInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices([...services, trimmed]);
      setServiceInput("");
    }
  };

  const removeService = (s: string) =>
    setServices(services.filter((x) => x !== s));

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-content-primary">
        {t("title")}
      </h1>

      {/* ─── Tab Bar ─── */}
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-secondary/60 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "text-content-primary"
                  : "text-content-tertiary hover:text-content-secondary"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="settings-tab"
                  className="absolute inset-0 rounded-lg bg-surface-elevated shadow-sm"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <Icon size={16} className="relative z-10" />
              <span className="relative z-10">{t(`tab_${tab.key}`)}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ TAB: Work Type ═══ */}
      <AnimatePresence mode="wait">
        {activeTab === "workType" && (
          <motion.div
            key="workType"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Success toast */}
            <AnimatePresence>
              {switchSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2 rounded-xl bg-status-success/8 px-4 py-3 text-sm font-medium text-status-success"
                >
                  <CheckCircle2 size={16} />
                  {t("switchSuccess")}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current mode display */}
            <div className="card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10">
                  <RefreshCw size={20} className="text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-content-primary">
                    {t("businessMode")}
                  </h2>
                  <p className="text-xs text-content-tertiary">
                    {t("businessModeDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl bg-surface-secondary/60 p-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${
                    isSolo
                      ? "from-violet-500 to-purple-600"
                      : "from-blue-500 to-indigo-600"
                  }`}
                >
                  {isSolo ? (
                    <User size={22} className="text-white" />
                  ) : (
                    <Users size={22} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-content-primary">
                    {isSolo ? t("currentModeSolo") : t("currentModeMulti")}
                  </p>
                  <p className="text-xs text-content-tertiary">
                    {isSolo
                      ? t("currentModeSoloDesc")
                      : t("currentModeMultiDesc")}
                  </p>
                </div>
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-bold ${
                    isSolo
                      ? "bg-violet-500/10 text-violet-600"
                      : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {isSolo ? t("solo") : t("multi")}
                </span>
              </div>
            </div>

            {/* Mode cards — switch options */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Solo card */}
              <div
                className={`card p-4 transition-all ${
                  isSolo
                    ? "ring-2 ring-violet-500/30 bg-violet-500/[0.03]"
                    : "hover:bg-surface-secondary/30"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <User
                    size={16}
                    className={
                      isSolo ? "text-violet-600" : "text-content-tertiary"
                    }
                  />
                  <span className="text-sm font-semibold text-content-primary">
                    {t("solo")}
                  </span>
                  {isSolo && (
                    <span className="ml-auto rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-600 uppercase">
                      {t("active")}
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-content-tertiary leading-relaxed">
                  {t("soloSwitchDesc")}
                </p>
                {!isSolo && (
                  <button
                    onClick={() => openModeEditor("SOLO")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-500/20"
                  >
                    {t("switchToSolo")} <ArrowRight size={12} />
                  </button>
                )}
              </div>

              {/* Multi card */}
              <div
                className={`card p-4 transition-all ${
                  isMulti
                    ? "ring-2 ring-blue-500/30 bg-blue-500/[0.03]"
                    : "hover:bg-surface-secondary/30"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Users
                    size={16}
                    className={
                      isMulti ? "text-blue-600" : "text-content-tertiary"
                    }
                  />
                  <span className="text-sm font-semibold text-content-primary">
                    {t("multi")}
                  </span>
                  {isMulti && (
                    <span className="ml-auto rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase">
                      {t("active")}
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-content-tertiary leading-relaxed">
                  {t("multiSwitchDesc")}
                </p>
                {!isMulti && (
                  <button
                    onClick={() => openModeEditor("MULTI")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-500/20"
                  >
                    {t("switchToMulti")} <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* ─── Solo Schedule Editor ─── */}
            {isSolo && (
              <div className="card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                    <Calendar size={20} className="text-violet-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-content-primary">
                      {t("soloScheduleTitle")}
                    </h2>
                    <p className="text-xs text-content-tertiary">
                      {t("soloScheduleDesc")}
                    </p>
                  </div>
                </div>

                {/* Slot duration */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-content-secondary">
                    {to("slotDuration")}
                  </label>
                  <div className="flex gap-1.5">
                    {[15, 30, 45, 60, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSlotDuration(d)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                          slotDuration === d
                            ? "bg-violet-600 text-white"
                            : "bg-surface-secondary text-content-secondary hover:bg-surface-secondary/80"
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Working hours table */}
                <div className="space-y-1.5 rounded-xl bg-surface-secondary/40 p-3">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setWorkingHours((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], closed: !prev[day].closed },
                          }))
                        }
                        className={`w-16 shrink-0 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors ${
                          workingHours[day].closed
                            ? "bg-surface-tertiary text-content-tertiary line-through"
                            : "bg-violet-500/10 text-violet-600"
                        }`}
                      >
                        {to(`day_${day}`)}
                      </button>
                      {!workingHours[day].closed ? (
                        <>
                          <input
                            type="time"
                            value={workingHours[day].start}
                            onChange={(e) =>
                              setWorkingHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], start: e.target.value },
                              }))
                            }
                            className="input-field h-7 w-20 text-[11px]"
                          />
                          <span className="text-content-tertiary">–</span>
                          <input
                            type="time"
                            value={workingHours[day].end}
                            onChange={(e) =>
                              setWorkingHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], end: e.target.value },
                              }))
                            }
                            className="input-field h-7 w-20 text-[11px]"
                          />
                        </>
                      ) : (
                        <span className="text-[11px] text-content-tertiary italic">
                          {to("closed")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={saveSoloSchedule}
                    disabled={scheduleSaving}
                    className="btn-primary text-xs"
                  >
                    {scheduleSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Clock size={14} />
                    )}
                    {t("saveSchedule")}
                  </button>
                  <AnimatePresence>
                    {scheduleSaved && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="flex items-center gap-1 text-xs font-medium text-status-success"
                      >
                        <CheckCircle2 size={13} />
                        {t("saved")}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Timeframe section — for multi mode: managed per-branch via Branches page */}

            {/* Average Service Time — solo only (multi manages per-branch) */}
            {isSolo && (
              <div className="card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Timer size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-content-primary">
                      {t("avgServiceTime")}
                    </h2>
                    <p className="text-xs text-content-tertiary">
                      {t("avgServiceTimeDesc")}
                    </p>
                  </div>
                </div>

                <div className="mb-3 rounded-xl bg-surface-secondary/40 p-4">
                  <label className="mb-2 block text-xs font-medium text-content-secondary">
                    {t("avgServiceTimeLabel")}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5}
                      max={120}
                      step={5}
                      value={avgServiceTime}
                      onChange={(e) =>
                        setAvgServiceTime(Number(e.target.value))
                      }
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-tertiary accent-amber-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                    />
                    <div className="flex items-baseline gap-1 rounded-lg bg-surface-secondary px-3 py-1.5">
                      <span className="text-lg font-bold text-content-primary">
                        {avgServiceTime}
                      </span>
                      <span className="text-[10px] text-content-tertiary">
                        {t("minutes")}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-content-tertiary">
                    <span>5 {t("minutes")}</span>
                    <span>120 {t("minutes")}</span>
                  </div>
                </div>

                <div className="mb-4 flex gap-1.5">
                  {[10, 15, 20, 30, 45, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setAvgServiceTime(d)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                        avgServiceTime === d
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-surface-secondary text-content-secondary hover:bg-surface-secondary/80"
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={saveAvgServiceTime}
                    disabled={avgSaving}
                    className="btn-primary text-xs"
                  >
                    {avgSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Timer size={14} />
                    )}
                    {t("saveAvgServiceTime")}
                  </button>
                  <AnimatePresence>
                    {avgSaved && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="flex items-center gap-1 text-xs font-medium text-status-success"
                      >
                        <CheckCircle2 size={13} />
                        {t("saved")}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ TAB: Telegram Bot ═══ */}
        {activeTab === "telegram" && (
          <motion.div
            key="telegram"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {botLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2
                  size={24}
                  className="animate-spin text-content-tertiary"
                />
              </div>
            ) : botStatus?.exists ? (
              <>
                {/* Bot header card */}
                <div className="card p-5">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        botStatus.isRunning
                          ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                          : "bg-surface-tertiary"
                      }`}
                    >
                      <Bot size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-content-primary">
                        @{botStatus.username || "unknown"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            botStatus.isRunning
                              ? "bg-status-success animate-pulse-soft"
                              : "bg-content-tertiary"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            botStatus.isRunning
                              ? "text-status-success"
                              : "text-content-tertiary"
                          }`}
                        >
                          {botStatus.isRunning
                            ? t("botRunning")
                            : t("botStopped")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!botStatus.isRunning ? (
                      <button
                        onClick={() => botAction("start")}
                        disabled={!!botActionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-status-success/10 px-3 py-1.5 text-xs font-semibold text-status-success transition-colors hover:bg-status-success/20 disabled:opacity-50"
                      >
                        {botActionLoading === "start" ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Play size={13} />
                        )}
                        {t("startBot")}
                      </button>
                    ) : (
                      <button
                        onClick={() => botAction("stop")}
                        disabled={!!botActionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                      >
                        {botActionLoading === "stop" ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Square size={13} />
                        )}
                        {t("stopBot")}
                      </button>
                    )}
                    <button
                      onClick={() => botAction("restart")}
                      disabled={!!botActionLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      {botActionLoading === "restart" ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RotateCcw size={13} />
                      )}
                      {t("restartBot")}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={!!botActionLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-status-error/8 px-3 py-1.5 text-xs font-semibold text-status-error transition-colors hover:bg-status-error/15 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      {t("deleteBot")}
                    </button>
                  </div>

                  {/* Delete confirmation */}
                  <AnimatePresence>
                    {showDeleteConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-status-error/20 bg-status-error/5 p-3">
                          <AlertTriangle
                            size={14}
                            className="shrink-0 text-status-error"
                          />
                          <p className="flex-1 text-xs text-content-secondary">
                            {t("deleteBotConfirm")}
                          </p>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-content-tertiary hover:bg-surface-secondary"
                          >
                            {tc("cancel")}
                          </button>
                          <button
                            onClick={() => botAction("delete")}
                            disabled={botActionLoading === "delete"}
                            className="inline-flex items-center gap-1 rounded-lg bg-status-error px-3 py-1 text-xs font-semibold text-white hover:bg-status-error/90 disabled:opacity-50"
                          >
                            {botActionLoading === "delete" ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            {tc("delete")}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {botError && (
                    <div className="mt-3 rounded-lg bg-status-error/8 px-3 py-2 text-xs font-medium text-status-error">
                      {botError}
                    </div>
                  )}
                </div>

                {/* Real-time stats */}
                {botStats && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="card flex flex-col items-center p-4 text-center">
                      <Activity size={18} className="mb-1.5 text-blue-500" />
                      <p className="text-lg font-bold text-content-primary">
                        {botStats.isRunning ? t("online") : t("offline")}
                      </p>
                      <p className="text-[10px] text-content-tertiary">
                        {t("statStatus")}
                      </p>
                    </div>
                    <div className="card flex flex-col items-center p-4 text-center">
                      <Users size={18} className="mb-1.5 text-violet-500" />
                      <p className="text-lg font-bold text-content-primary">
                        {botStats.totalUsers}
                      </p>
                      <p className="text-[10px] text-content-tertiary">
                        {t("statTotalUsers")}
                      </p>
                    </div>
                    <div className="card flex flex-col items-center p-4 text-center">
                      <UserCheck
                        size={18}
                        className="mb-1.5 text-emerald-500"
                      />
                      <p className="text-lg font-bold text-content-primary">
                        {botStats.linkedUsers}
                      </p>
                      <p className="text-[10px] text-content-tertiary">
                        {t("statLinkedUsers")}
                      </p>
                    </div>
                    <div className="card flex flex-col items-center p-4 text-center">
                      <Link2 size={18} className="mb-1.5 text-amber-500" />
                      <p className="text-lg font-bold text-content-primary">
                        @{botStats.username || "–"}
                      </p>
                      <p className="text-[10px] text-content-tertiary">
                        {t("statBotHandle")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bot info */}
                <div className="card p-5">
                  <h3 className="mb-3 text-sm font-semibold text-content-primary">
                    {t("botInfo")}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-content-tertiary">
                        {t("botUsername")}
                      </span>
                      <span className="font-medium text-content-primary">
                        @{botStatus.username || "–"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-content-tertiary">
                        {t("botStatus")}
                      </span>
                      <span
                        className={`font-medium ${botStatus.isRunning ? "text-status-success" : "text-content-tertiary"}`}
                      >
                        {botStatus.isRunning
                          ? t("botRunning")
                          : t("botStopped")}
                      </span>
                    </div>
                    {botStatus.createdAt && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-content-tertiary">
                          {t("botCreated")}
                        </span>
                        <span className="font-medium text-content-primary">
                          {new Date(botStatus.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Update bot token */}
                <div className="card p-5">
                  <h3 className="mb-3 text-sm font-semibold text-content-primary">
                    {t("updateBotToken")}
                  </h3>
                  <p className="mb-3 text-xs text-content-tertiary">
                    {t("updateBotTokenDesc")}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder={t("botTokenPlaceholder")}
                      className="input-field flex-1 text-xs"
                    />
                    <button
                      onClick={connectBot}
                      disabled={!!botActionLoading || !botToken.trim()}
                      className="btn-primary text-xs"
                    >
                      {botActionLoading === "connect" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      {t("updateToken")}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* No bot — setup flow */
              <div className="card p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Bot size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-content-primary">
                      {t("telegramBot")}
                    </h2>
                    <p className="text-xs text-content-tertiary">
                      {t("botSetupDesc")}
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-xl bg-surface-secondary/60 p-4">
                  <p className="mb-2 text-xs font-medium text-content-secondary">
                    {t("howToSetup")}
                  </p>
                  <ol className="space-y-1.5 text-xs text-content-tertiary">
                    <li>1. {t("setupStep1")}</li>
                    <li>2. {t("setupStep2")}</li>
                    <li>3. {t("setupStep3")}</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder={t("botTokenPlaceholder")}
                    className="input-field flex-1 text-xs"
                  />
                  <button
                    onClick={connectBot}
                    disabled={!!botActionLoading || !botToken.trim()}
                    className="btn-primary text-xs"
                  >
                    {botActionLoading === "connect" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plug size={14} />
                    )}
                    {t("connectBot")}
                  </button>
                </div>
                {botError && (
                  <div className="mt-3 rounded-lg bg-status-error/8 px-3 py-2 text-xs font-medium text-status-error">
                    {botError}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Mode Switch Overlay (Modal / Drawer) ═══ */}
      <Overlay
        open={showModeEditor}
        onClose={() => setShowModeEditor(false)}
        title={switchTarget === "SOLO" ? t("switchToSolo") : t("switchToMulti")}
        isMobile={isMobile}
      >
        {switchTarget === "MULTI" ? (
          /* ─── Switch to Multi ─── */
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl bg-blue-500/5 p-3">
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0 text-blue-600"
              />
              <div>
                <p className="text-sm font-semibold text-content-primary">
                  {t("confirmSwitchToMulti")}
                </p>
                <p className="mt-1 text-xs text-content-tertiary leading-relaxed">
                  {t("confirmSwitchToMultiDesc")}
                </p>
              </div>
            </div>

            {/* Timeframe for multi */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-content-secondary">
                {t("operatingHours")}
              </label>
              <div className="space-y-1.5 rounded-xl bg-surface-secondary/40 p-2.5">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setMultiWorkingHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], closed: !prev[day].closed },
                        }))
                      }
                      className={`w-14 shrink-0 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors ${
                        multiWorkingHours[day].closed
                          ? "bg-surface-tertiary text-content-tertiary line-through"
                          : "bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      {to(`day_${day}`)}
                    </button>
                    {!multiWorkingHours[day].closed ? (
                      <>
                        <input
                          type="time"
                          value={multiWorkingHours[day].start}
                          onChange={(e) =>
                            setMultiWorkingHours((prev) => ({
                              ...prev,
                              [day]: { ...prev[day], start: e.target.value },
                            }))
                          }
                          className="input-field h-7 w-20 text-[11px]"
                        />
                        <span className="text-content-tertiary">–</span>
                        <input
                          type="time"
                          value={multiWorkingHours[day].end}
                          onChange={(e) =>
                            setMultiWorkingHours((prev) => ({
                              ...prev,
                              [day]: { ...prev[day], end: e.target.value },
                            }))
                          }
                          className="input-field h-7 w-20 text-[11px]"
                        />
                      </>
                    ) : (
                      <span className="text-[11px] text-content-tertiary italic">
                        {to("closed")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {switchError && (
              <div className="rounded-lg bg-status-error/8 px-3 py-2 text-xs font-medium text-status-error">
                {switchError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowModeEditor(false)}
                className="btn-secondary text-xs"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={handleSwitchMode}
                disabled={switching}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {switching ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Users size={14} />
                )}
                {switching ? tc("loading") : t("confirmSwitch")}
              </button>
            </div>
          </div>
        ) : (
          /* ─── Switch to Solo — Setup Profile ─── */
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl bg-violet-500/5 p-3">
              <User size={16} className="mt-0.5 shrink-0 text-violet-600" />
              <div>
                <p className="text-sm font-semibold text-content-primary">
                  {t("setupSoloProfile")}
                </p>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  {t("setupSoloProfileDesc")}
                </p>
              </div>
            </div>

            {/* Business type */}
            <div>
              <label className="mb-2 block text-xs font-medium text-content-secondary">
                {to("businessType")} *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.key}
                    onClick={() => setBusinessType(bt.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all ${
                      businessType === bt.key
                        ? "bg-surface-primary ring-2 ring-violet-500 shadow-sm"
                        : "bg-surface-secondary/60 hover:bg-surface-secondary"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${bt.color}`}
                    >
                      <bt.icon size={14} className="text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-content-primary">
                      {to(`type_${bt.key}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-content-secondary">
                {to("yourServices")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addService())
                  }
                  placeholder={to("servicePlaceholder")}
                  className="input-field flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={addService}
                  className="btn-primary px-3 text-xs"
                >
                  +
                </button>
              </div>
              {services.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {services.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600"
                    >
                      {s}
                      <button
                        onClick={() => removeService(s)}
                        className="text-violet-400 hover:text-violet-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Slot duration */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-content-secondary">
                {to("slotDuration")}
              </label>
              <div className="flex gap-1.5">
                {[15, 30, 45, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSlotDuration(d)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                      slotDuration === d
                        ? "bg-violet-600 text-white"
                        : "bg-surface-secondary text-content-secondary hover:bg-surface-secondary/80"
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {/* Working hours */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-content-secondary">
                {to("workingHours")}
              </label>
              <div className="space-y-1.5 rounded-xl bg-surface-secondary/40 p-2.5">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setWorkingHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], closed: !prev[day].closed },
                        }))
                      }
                      className={`w-14 shrink-0 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors ${
                        workingHours[day].closed
                          ? "bg-surface-tertiary text-content-tertiary line-through"
                          : "bg-violet-500/10 text-violet-600"
                      }`}
                    >
                      {to(`day_${day}`)}
                    </button>
                    {!workingHours[day].closed ? (
                      <>
                        <input
                          type="time"
                          value={workingHours[day].start}
                          onChange={(e) =>
                            setWorkingHours((prev) => ({
                              ...prev,
                              [day]: { ...prev[day], start: e.target.value },
                            }))
                          }
                          className="input-field h-7 w-20 text-[11px]"
                        />
                        <span className="text-content-tertiary">–</span>
                        <input
                          type="time"
                          value={workingHours[day].end}
                          onChange={(e) =>
                            setWorkingHours((prev) => ({
                              ...prev,
                              [day]: { ...prev[day], end: e.target.value },
                            }))
                          }
                          className="input-field h-7 w-20 text-[11px]"
                        />
                      </>
                    ) : (
                      <span className="text-[11px] text-content-tertiary italic">
                        {to("closed")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {switchError && (
              <div className="rounded-lg bg-status-error/8 px-3 py-2 text-xs font-medium text-status-error">
                {switchError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowModeEditor(false)}
                className="btn-secondary text-xs"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={handleSwitchMode}
                disabled={switching || !businessType}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
              >
                {switching ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <User size={14} />
                )}
                {switching ? tc("loading") : t("confirmSwitch")}
              </button>
            </div>
          </div>
        )}
      </Overlay>
    </div>
  );
}
