"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Clock,
  Calendar,
  Building2,
  Bot,
  Briefcase,
  Scissors,
  Stethoscope,
  GraduationCap,
  Wrench,
  Store,
  ChevronRight,
  Loader2,
  Rocket,
} from "lucide-react";
import { useRouter } from "../../../i18n/navigation";
import { useAuthStore, useHydration } from "../../../lib/store";
import { api } from "../../../lib/api";

/* ─── step config ─── */
const TOTAL_STEPS = 3;

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

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const hasHydrated = useHydration();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"solo" | "multi" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Solo profile fields
  const [businessType, setBusinessType] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [workingHours, setWorkingHours] = useState<
    Record<string, { start: string; end: string; closed: boolean }>
  >(() => {
    const defaults: any = {};
    DAYS.forEach((d) => {
      defaults[d] = {
        start: "09:00",
        end: "18:00",
        closed: d === "sunday",
      };
    });
    return defaults;
  });

  useEffect(() => {
    if (hasHydrated && !user) {
      router.push("/auth/login");
    }
    if (hasHydrated && user?.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  const addService = () => {
    const trimmed = serviceInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices([...services, trimmed]);
      setServiceInput("");
    }
  };

  const removeService = (s: string) =>
    setServices(services.filter((x) => x !== s));

  const handleComplete = async () => {
    if (!token || !mode) return;
    setSaving(true);
    setError("");
    try {
      const payload: any = { mode: mode.toUpperCase() };

      if (mode === "solo") {
        payload.soloProfile = {
          businessType,
          services,
          slotDuration,
          breakBetweenSlots: 5,
          workingHours,
        };
      }

      const tenant = await api.onboarding.complete(payload, token);

      // Refresh auth to include the new mode
      const refreshData = await api.auth.refresh(
        useAuthStore.getState().refreshToken!,
      );
      setAuth(refreshData);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return mode !== null;
    if (step === 1) {
      if (mode === "multi") return true;
      return businessType !== "";
    }
    if (step === 2) return true;
    return true;
  };

  const nextStep = () => {
    if (step === 0 && mode === "multi") {
      // Multi mode skips solo profile setup, go straight to confirmation
      setStep(TOTAL_STEPS - 1);
    } else if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step === TOTAL_STEPS - 1 && mode === "multi") {
      setStep(0);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent-primary/5 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -120, 80, 0],
            y: [0, 60, -100, 0],
            scale: [1, 0.8, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-secondary/5 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 60, -80, 0],
            y: [0, -40, 80, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 left-1/2 h-64 w-64 rounded-full bg-accent-tertiary/3 blur-3xl"
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8 w-full max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-content-tertiary">
              {t("step")} {step + 1} / {TOTAL_STEPS}
            </span>
            <span className="text-xs font-medium text-accent-primary">
              {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-tertiary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
              initial={{ width: 0 }}
              animate={{
                width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* ─── STEP 0: Choose Mode ─── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      bounce: 0.5,
                      delay: 0.2,
                    }}
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-glow"
                  >
                    <Sparkles size={28} className="text-white" />
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-content-primary"
                  >
                    {t("welcomeTitle", { name: user.firstName })}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-2 text-content-secondary"
                  >
                    {t("welcomeSubtitle")}
                  </motion.p>
                </div>

                {/* Mode cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Solo */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMode("solo")}
                    className={`relative card p-6 text-left transition-all ${
                      mode === "solo"
                        ? "ring-2 ring-accent-primary shadow-glow"
                        : "hover:shadow-medium"
                    }`}
                  >
                    {mode === "solo" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent-primary"
                      >
                        <Check size={14} className="text-white" />
                      </motion.div>
                    )}
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                      <User size={22} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-content-primary">
                      {t("soloTitle")}
                    </h3>
                    <p className="mt-1.5 text-sm text-content-tertiary leading-relaxed">
                      {t("soloDesc")}
                    </p>
                    <div className="mt-4 space-y-2">
                      {[
                        { icon: Calendar, text: t("soloFeature1") },
                        { icon: Bot, text: t("soloFeature2") },
                        { icon: Clock, text: t("soloFeature3") },
                      ].map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-content-secondary"
                        >
                          <f.icon size={13} className="text-accent-primary" />
                          {f.text}
                        </div>
                      ))}
                    </div>
                  </motion.button>

                  {/* Multi */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMode("multi")}
                    className={`relative card p-6 text-left transition-all ${
                      mode === "multi"
                        ? "ring-2 ring-accent-primary shadow-glow"
                        : "hover:shadow-medium"
                    }`}
                  >
                    {mode === "multi" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent-primary"
                      >
                        <Check size={14} className="text-white" />
                      </motion.div>
                    )}
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                      <Users size={22} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-content-primary">
                      {t("multiTitle")}
                    </h3>
                    <p className="mt-1.5 text-sm text-content-tertiary leading-relaxed">
                      {t("multiDesc")}
                    </p>
                    <div className="mt-4 space-y-2">
                      {[
                        { icon: Building2, text: t("multiFeature1") },
                        { icon: Users, text: t("multiFeature2") },
                        { icon: Sparkles, text: t("multiFeature3") },
                      ].map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-content-secondary"
                        >
                          <f.icon size={13} className="text-accent-primary" />
                          {f.text}
                        </div>
                      ))}
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 1: Solo Profile Setup ─── */}
            {step === 1 && mode === "solo" && (
              <motion.div
                key="step-1-solo"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-xl font-bold text-content-primary">
                    {t("setupTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-content-tertiary">
                    {t("setupSubtitle")}
                  </p>
                </div>

                {/* Business type grid */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-content-secondary">
                    {t("businessType")}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUSINESS_TYPES.map((bt, i) => (
                      <motion.button
                        key={bt.key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setBusinessType(bt.key)}
                        className={`card flex flex-col items-center gap-2 p-3 transition-all ${
                          businessType === bt.key
                            ? "ring-2 ring-accent-primary"
                            : ""
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${bt.color}`}
                        >
                          <bt.icon size={18} className="text-white" />
                        </div>
                        <span className="text-xs font-medium text-content-primary">
                          {t(`type_${bt.key}`)}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                    {t("yourServices")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addService())
                      }
                      placeholder={t("servicePlaceholder")}
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={addService}
                      className="btn-primary px-4"
                    >
                      +
                    </button>
                  </div>
                  {services.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {services.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-lg bg-accent-primary/10 px-2.5 py-1 text-xs font-medium text-accent-primary"
                        >
                          {s}
                          <button
                            onClick={() => removeService(s)}
                            className="ml-0.5 text-accent-primary/60 hover:text-accent-primary"
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
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                    {t("slotDuration")}
                  </label>
                  <div className="flex gap-2">
                    {[15, 30, 45, 60, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => setSlotDuration(d)}
                        className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                          slotDuration === d
                            ? "bg-accent-primary text-white shadow-glow"
                            : "bg-surface-secondary text-content-secondary hover:bg-surface-tertiary"
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Working hours */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-content-secondary">
                    {t("workingHours")}
                  </label>
                  <div className="space-y-2 rounded-xl bg-surface-secondary/40 p-3">
                    {DAYS.map((day) => (
                      <div
                        key={day}
                        className="flex items-center gap-2 text-sm"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setWorkingHours((prev) => ({
                              ...prev,
                              [day]: {
                                ...prev[day],
                                closed: !prev[day].closed,
                              },
                            }))
                          }
                          className={`w-20 shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                            workingHours[day].closed
                              ? "bg-surface-tertiary text-content-tertiary line-through"
                              : "bg-accent-primary/10 text-accent-primary"
                          }`}
                        >
                          {t(`day_${day}`)}
                        </button>
                        {!workingHours[day].closed && (
                          <>
                            <input
                              type="time"
                              value={workingHours[day].start}
                              onChange={(e) =>
                                setWorkingHours((prev) => ({
                                  ...prev,
                                  [day]: {
                                    ...prev[day],
                                    start: e.target.value,
                                  },
                                }))
                              }
                              className="input-field h-8 w-24 text-xs"
                            />
                            <span className="text-content-tertiary">–</span>
                            <input
                              type="time"
                              value={workingHours[day].end}
                              onChange={(e) =>
                                setWorkingHours((prev) => ({
                                  ...prev,
                                  [day]: {
                                    ...prev[day],
                                    end: e.target.value,
                                  },
                                }))
                              }
                              className="input-field h-8 w-24 text-xs"
                            />
                          </>
                        )}
                        {workingHours[day].closed && (
                          <span className="text-xs text-content-tertiary italic">
                            {t("closed")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 2: Confirmation ─── */}
            {step === TOTAL_STEPS - 1 && (
              <motion.div
                key="step-final"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      bounce: 0.4,
                      delay: 0.2,
                    }}
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-tertiary shadow-glow"
                  >
                    <Rocket size={36} className="text-white" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-content-primary"
                  >
                    {t("readyTitle")}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 text-content-secondary"
                  >
                    {mode === "solo" ? t("readyDescSolo") : t("readyDescMulti")}
                  </motion.p>
                </div>

                {/* Summary card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="card p-5 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
                        mode === "solo"
                          ? "from-violet-500 to-purple-600"
                          : "from-blue-500 to-indigo-600"
                      }`}
                    >
                      {mode === "solo" ? (
                        <User size={18} className="text-white" />
                      ) : (
                        <Users size={18} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-content-primary">
                        {mode === "solo" ? t("soloTitle") : t("multiTitle")}
                      </p>
                      <p className="text-xs text-content-tertiary">
                        {mode === "solo"
                          ? t("readySoloHint")
                          : t("readyMultiHint")}
                      </p>
                    </div>
                  </div>

                  {mode === "solo" && (
                    <>
                      {businessType && (
                        <div className="flex items-center gap-2 rounded-lg bg-surface-secondary/60 px-3 py-2">
                          <Briefcase
                            size={14}
                            className="text-content-tertiary"
                          />
                          <span className="text-sm text-content-primary">
                            {t(`type_${businessType}`)}
                          </span>
                        </div>
                      )}
                      {services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {services.map((s) => (
                            <span
                              key={s}
                              className="rounded-lg bg-accent-primary/8 px-2.5 py-1 text-xs font-medium text-accent-primary"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-content-secondary">
                        <Clock size={14} className="text-content-tertiary" />
                        {slotDuration} {t("minPerSlot")}
                      </div>
                    </>
                  )}
                </motion.div>

                {mode === "solo" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center text-xs text-content-tertiary"
                  >
                    {t("canSwitchLater")}
                  </motion.p>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error"
                  >
                    {error}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex w-full max-w-lg items-center justify-between"
        >
          <button
            onClick={prevStep}
            disabled={step === 0}
            className={`btn-ghost flex items-center gap-2 ${
              step === 0 ? "opacity-0 pointer-events-none" : ""
            }`}
          >
            <ArrowLeft size={16} />
            {tc("back")}
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-2"
            >
              {tc("next")}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving || !canProceed()}
              className="btn-primary flex items-center gap-2 px-8"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Rocket size={16} />
              )}
              {saving ? tc("loading") : t("launchButton")}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
