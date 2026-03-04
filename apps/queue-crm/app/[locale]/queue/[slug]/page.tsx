"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Clock,
  Phone,
  Users,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Ticket,
  Zap,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Timer,
  Hash,
  LayoutDashboard,
  UserCircle,
  User,
  Globe,
} from "lucide-react";
import { useRouter, Link } from "../../../../i18n/navigation";
import { api } from "../../../../lib/api";
import { useTicketStore } from "../../../../lib/store";
import { PhoneInput } from "../../../../components/ui/phone-input";

/* ─── Types ─── */
interface Branch {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  address: string;
  phone?: string;
  workingHours?: string;
  isActive: boolean;
}

interface QueueService {
  _id: string;
  name: string;
  prefix: string;
  tenantId: string;
  branchId: string;
  isActive: boolean;
  currentTicket?: number;
  waitingCount?: number;
}

/* ─── Steps ─── */
type Step = "language" | "services" | "confirm" | "success";

/* ─── Language options (always displayed in native script) ─── */
const LANGUAGES = [
  {
    code: "uz" as const,
    native: "O'zbekcha",
    flag: "🇺🇿",
    sub: "Davom etish uchun tanlang",
  },
  {
    code: "ru" as const,
    native: "Русский",
    flag: "🇷🇺",
    sub: "Выберите, чтобы продолжить",
  },
  {
    code: "en" as const,
    native: "English",
    flag: "🇬🇧",
    sub: "Select to continue",
  },
];

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

/* ─── Branch Hero Banner ─── */
function BranchBanner({ branch, t }: { branch: Branch; t: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-primary/10 via-surface-elevated to-accent-secondary/8 p-6 sm:p-8 shadow-soft backdrop-blur-sm border border-accent-primary/10"
    >
      {/* Decorative grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-glow">
          <Building2 size={28} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-status-success/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-status-success">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
              {t("open")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight">
            {branch.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-content-secondary">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-content-tertiary" />
              {branch.address}
            </span>
            {branch.workingHours && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-content-tertiary" />
                {branch.workingHours}
              </span>
            )}
            {branch.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={13} className="text-content-tertiary" />
                {branch.phone}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Service Card ─── */
function ServiceCard({
  service,
  isSelected,
  onSelect,
  index,
  t,
}: {
  service: QueueService;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  t: any;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.1 + index * 0.06,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`group relative w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
        isSelected
          ? "border-accent-primary/40 bg-accent-primary/5 shadow-glow ring-1 ring-accent-primary/20"
          : "border-surface-tertiary bg-surface-elevated hover:border-accent-primary/20 hover:bg-surface-secondary/40 hover:shadow-medium"
      }`}
    >
      {/* Selection indicator */}
      <div
        className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 ${
          isSelected
            ? "border-accent-primary bg-accent-primary scale-100"
            : "border-surface-tertiary scale-90 group-hover:border-accent-primary/40"
        }`}
      >
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.4 }}
          >
            <CheckCircle2 size={14} className="text-white" />
          </motion.div>
        )}
      </div>

      {/* Service prefix badge */}
      <div
        className={`mb-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold tracking-wide transition-colors ${
          isSelected
            ? "bg-accent-primary/12 text-accent-primary"
            : "bg-surface-secondary text-content-tertiary group-hover:bg-accent-primary/8 group-hover:text-accent-primary"
        }`}
      >
        <Hash size={11} />
        {service.prefix}
      </div>

      {/* Service name */}
      <h3 className="pr-8 text-lg font-semibold text-content-primary transition-colors group-hover:text-accent-primary">
        {service.name}
      </h3>

      {/* Live stats bar */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-content-tertiary">
          <Users size={12} />
          <span>
            {service.waitingCount ?? "–"} {t("inQueue")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-content-tertiary">
          <Timer size={12} />
          <span>
            ~{service.waitingCount ? service.waitingCount * 4 : 0}{" "}
            {t("minutes")}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Step Indicator ─── */
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; num: number }[] = [
    { key: "language", num: 1 },
    { key: "services", num: 2 },
    { key: "confirm", num: 3 },
    { key: "success", num: 4 },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => {
        const isActive = step.key === currentStep;
        const isCompleted = steps.findIndex((s) => s.key === currentStep) > i;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                isCompleted
                  ? "bg-accent-primary text-white scale-90"
                  : isActive
                    ? "bg-accent-primary text-white shadow-glow scale-110"
                    : "bg-surface-secondary text-content-tertiary"
              }`}
            >
              {isCompleted ? <CheckCircle2 size={14} /> : step.num}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 rounded-full transition-colors duration-500 ${
                  isCompleted ? "bg-accent-primary" : "bg-surface-tertiary"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page Component ─── */
export default function BranchTicketingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("queue");
  const tc = useTranslations("common");
  const router = useRouter();
  const currentLocale = useLocale();
  const searchParams = useSearchParams();
  const setActiveTicket = useTicketStore((s) => s.setActiveTicket);

  const langSelected = searchParams.get("ls") === "1";

  const [branch, setBranch] = useState<Branch | null>(null);
  const [services, setServices] = useState<QueueService[]>([]);
  const [selectedService, setSelectedService] = useState<QueueService | null>(
    null,
  );
  const [phone, setPhone] = useState("+998");
  const [customerName, setCustomerName] = useState("");
  const [customerFound, setCustomerFound] = useState<boolean | null>(null);
  const [checkingCustomer, setCheckingCustomer] = useState(false);
  const [step, setStep] = useState<Step>(
    langSelected ? "services" : "language",
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<any>(null);

  /* ─── Fetch branch and services ─── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const branchData = await api.branches.getBySlug(slug);
      if (!branchData || !branchData.isActive) {
        setError("branchNotFound");
        setLoading(false);
        return;
      }
      setBranch(branchData);

      const queues = await api.queues.list({
        tenantId: branchData.tenantId,
        branchId: branchData._id,
      });
      const active = (Array.isArray(queues) ? queues : []).filter(
        (q: any) => q.isActive,
      );
      setServices(active);
    } catch (err: any) {
      setError("branchNotFound");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── Fetch live counts periodically ─── */
  useEffect(() => {
    if (!branch || services.length === 0) return;
    const fetchLive = async () => {
      try {
        const updated = await Promise.all(
          services.map(async (svc) => {
            try {
              const live = await api.queues.liveStatus(
                svc._id,
                svc.tenantId,
                svc.branchId,
              );
              return {
                ...svc,
                waitingCount: live?.waitingCount ?? 0,
                currentTicket: live?.currentTicket ?? 0,
              };
            } catch {
              return svc;
            }
          }),
        );
        setServices(updated);
      } catch {
        /* ignore */
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch?._id]);

  /* ─── Auto-check customer when phone is fully entered ─── */
  useEffect(() => {
    if (phone.length < 13 || !branch) {
      setCustomerFound(null);
      setCustomerName("");
      return;
    }
    let cancelled = false;
    const check = async () => {
      setCheckingCustomer(true);
      try {
        const result = await api.tickets.checkCustomer(phone, branch.tenantId);
        if (cancelled) return;
        if (result.exists) {
          setCustomerFound(true);
          setCustomerName(result.firstName || "");
        } else {
          setCustomerFound(false);
          setCustomerName("");
        }
      } catch {
        if (!cancelled) setCustomerFound(false);
      } finally {
        if (!cancelled) setCheckingCustomer(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [phone, branch]);

  /* ─── Take Ticket ─── */
  const handleTakeTicket = async () => {
    if (!selectedService || !branch) return;
    if (phone.length < 13 || !customerName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const newTicket = await api.tickets.create({
        tenantId: selectedService.tenantId,
        branchId: selectedService.branchId,
        queueId: selectedService._id,
        customerPhone: phone,
        customerName: customerName.trim(),
      });
      setTicket(newTicket);
      setActiveTicket(newTicket);
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to take ticket");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <DashboardButton />
        <AmbientOrbs />
        <div className="flex items-center justify-center py-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary animate-pulse" />
              <Loader2
                size={24}
                className="absolute inset-0 m-auto text-white animate-spin"
              />
            </div>
            <p className="text-sm text-content-tertiary font-medium">
              {tc("loading")}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── Error / Not Found ─── */
  if (error === "branchNotFound" || !branch) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <DashboardButton />
        <AmbientOrbs />
        <div className="flex items-center justify-center py-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-sm text-center"
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-status-warning/10">
              <AlertTriangle size={36} className="text-status-warning" />
            </div>
            <h2 className="text-xl font-bold text-content-primary">
              {t("branchNotFound")}
            </h2>
            <p className="mt-2 text-sm text-content-tertiary">
              {t("branchNotFoundDesc")}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── Main Content ─── */
  return (
    <div className="min-h-screen bg-surface-primary">
      <DashboardButton />
      <AmbientOrbs />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Branch banner — hidden during language step */}
        {step !== "language" && <BranchBanner branch={branch} t={t} />}

        {/* Step indicator */}
        <div className={step === "language" ? "mb-6" : "mt-8 mb-8"}>
          <StepIndicator currentStep={step} />
        </div>

        {/* ─── Step 0: Choose Language ─── */}
        <AnimatePresence mode="wait">
          {step === "language" && (
            <motion.div
              key="language"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              {/* Futuristic globe icon */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="relative mb-6"
              >
                <div className="relative flex h-20 w-20 items-center justify-center">
                  {/* Spinning ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-accent-primary/20"
                  />
                  {/* Pulsing glow */}
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-secondary/15 blur-sm animate-pulse" />
                  {/* Inner circle */}
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary shadow-glow">
                    <Globe size={26} className="text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Title — multilingual static text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-2 text-center"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">
                  {t("chooseLanguage")}
                </h2>
                <p className="mt-1 text-sm text-content-tertiary">
                  {t("chooseLanguageDesc")}
                </p>
              </motion.div>

              {/* Language cards */}
              <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                {LANGUAGES.map((lang, i) => {
                  const isCurrentLocale = lang.code === currentLocale;
                  return (
                    <motion.button
                      key={lang.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.3 + i * 0.1,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (isCurrentLocale) {
                          setStep("services");
                        } else {
                          router.replace(`/queue/${slug}?ls=1`, {
                            locale: lang.code,
                          });
                        }
                      }}
                      className={`group relative flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all duration-300 ${
                        isCurrentLocale
                          ? "border-accent-primary/40 bg-accent-primary/5 shadow-glow ring-1 ring-accent-primary/20"
                          : "border-surface-tertiary bg-surface-elevated hover:border-accent-primary/25 hover:bg-surface-secondary/50 hover:shadow-medium"
                      }`}
                    >
                      {/* Active ring indicator */}
                      {isCurrentLocale && (
                        <motion.div
                          layoutId="lang-active"
                          className="absolute -inset-px rounded-2xl border-2 border-accent-primary/30"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.5,
                          }}
                        />
                      )}

                      {/* Flag */}
                      <span className="text-4xl leading-none">{lang.flag}</span>

                      {/* Native name */}
                      <span className="text-base font-bold text-content-primary group-hover:text-accent-primary transition-colors">
                        {lang.native}
                      </span>

                      {/* Subtitle */}
                      <span className="text-xs text-content-tertiary">
                        {lang.sub}
                      </span>

                      {/* Glow effect on hover */}
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary/0 to-accent-secondary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.04]" />
                    </motion.button>
                  );
                })}
              </div>

              {/* Powered by footer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 text-[11px] text-content-tertiary/50"
              >
                Powered by <span className="font-semibold">QueuePro</span>
              </motion.p>
            </motion.div>
          )}

          {/* ─── Step 1: Select Service ─── */}
          {step === "services" && (
            <motion.div
              key="services"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10">
                  <Sparkles size={18} className="text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-content-primary">
                    {t("selectService")}
                  </h2>
                  <p className="text-sm text-content-tertiary">
                    {t("selectServiceDesc")}
                  </p>
                </div>
              </div>

              {services.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-surface-tertiary bg-surface-elevated p-10 text-center"
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary">
                    <Ticket size={24} className="text-content-tertiary" />
                  </div>
                  <p className="font-medium text-content-secondary">
                    {t("noServices")}
                  </p>
                  <p className="mt-1 text-sm text-content-tertiary">
                    {t("noServicesDesc")}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {services.map((svc, i) => (
                    <ServiceCard
                      key={svc._id}
                      service={svc}
                      isSelected={selectedService?._id === svc._id}
                      onSelect={() => setSelectedService(svc)}
                      index={i}
                      t={t}
                    />
                  ))}
                </div>
              )}

              {/* Continue button */}
              <AnimatePresence>
                {selectedService && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    className="mt-6"
                  >
                    <button
                      onClick={() => setStep("confirm")}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary px-6 py-4 text-base font-semibold text-white shadow-glow transition-all hover:shadow-glow-strong hover:brightness-110 active:scale-[0.98]"
                    >
                      {t("continueToConfirm")}
                      <ChevronRight
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─── Step 2: Confirm & Take Ticket ─── */}
          {step === "confirm" && selectedService && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10">
                  <Ticket size={18} className="text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-content-primary">
                    {t("takeNumber")}
                  </h2>
                  <p className="text-sm text-content-tertiary">
                    {t("confirmDesc")}
                  </p>
                </div>
              </div>

              {/* Selected service summary */}
              <div className="mb-5 rounded-2xl border border-accent-primary/15 bg-accent-primary/4 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-content-tertiary">
                      {t("selectedService")}
                    </p>
                    <p className="mt-1 text-lg font-bold text-content-primary">
                      {selectedService.name}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary/10">
                    <span className="text-lg font-bold text-accent-primary">
                      {selectedService.prefix}
                    </span>
                  </div>
                </div>
                {selectedService.waitingCount != null &&
                  selectedService.waitingCount > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-elevated/60 px-3 py-2 text-sm">
                      <Users size={14} className="text-content-tertiary" />
                      <span className="text-content-secondary">
                        {selectedService.waitingCount} {t("people")}
                        {" · "}~{selectedService.waitingCount * 4}{" "}
                        {t("minutes")} {t("estimated").toLowerCase()}
                      </span>
                    </div>
                  )}
              </div>

              {/* Phone (mandatory) */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-content-secondary">
                  {t("phoneRequired")}
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  required
                  customStyle="w-full rounded-xl border border-surface-tertiary bg-surface-elevated px-4 py-3.5 pl-11 text-sm text-content-primary placeholder-content-tertiary outline-none transition-all focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10"
                />
                {phone.length === 13 && checkingCustomer && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-content-tertiary">
                    <Loader2 size={12} className="animate-spin" />
                    {t("checkingCustomer")}
                  </div>
                )}
                {customerFound === true && !checkingCustomer && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-status-success/8 px-3 py-2 text-xs font-medium text-status-success">
                    <CheckCircle2 size={13} />
                    {t("welcomeBack", { name: customerName })}
                  </div>
                )}
              </div>

              {/* Name (mandatory — auto-filled if customer found) */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-content-secondary">
                  {t("customerNameRequired")}
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary"
                  />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t("enterName")}
                    required
                    className="w-full rounded-xl border border-surface-tertiary bg-surface-elevated px-4 py-3.5 pl-11 text-sm text-content-primary placeholder-content-tertiary outline-none transition-all focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10"
                  />
                </div>
                {customerFound === false &&
                  phone.length === 13 &&
                  !checkingCustomer && (
                    <p className="mt-1.5 text-xs text-content-tertiary">
                      {t("newCustomerHint")}
                    </p>
                  )}
              </div>

              {/* Error message */}
              {error && error !== "branchNotFound" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error"
                >
                  {error}
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("services")}
                  className="flex-1 rounded-2xl border border-surface-tertiary bg-surface-elevated px-4 py-3.5 text-sm font-semibold text-content-secondary transition-all hover:bg-surface-secondary"
                >
                  {tc("back")}
                </button>
                <button
                  onClick={handleTakeTicket}
                  disabled={
                    submitting || phone.length < 13 || !customerName.trim()
                  }
                  className="group flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-strong hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Zap size={16} />
                      {t("joinQueue")}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Success ─── */}
          {step === "success" && ticket && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              {/* Success animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  bounce: 0.4,
                  duration: 0.8,
                  delay: 0.1,
                }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-glow-strong"
              >
                <CheckCircle2 size={44} className="text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-content-primary"
              >
                {t("success")}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-sm text-content-tertiary"
              >
                {t("waitMessage")}
              </motion.p>

              {/* Ticket card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mx-auto mt-8 max-w-xs overflow-hidden rounded-3xl border border-accent-primary/15 bg-surface-elevated shadow-large"
              >
                {/* Ticket header */}
                <div className="bg-gradient-to-r from-accent-primary to-accent-secondary px-6 py-4">
                  <p className="text-xs font-medium text-white/70 uppercase tracking-wider">
                    {t("yourTicket")}
                  </p>
                  <p className="mt-1 text-4xl font-black text-white tracking-tight">
                    {ticket.ticketNumber || ticket.publicId}
                  </p>
                </div>
                {/* Ticket body */}
                <div className="divide-y divide-surface-tertiary px-6">
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs text-content-tertiary">
                      {t("selectedService")}
                    </span>
                    <span className="text-sm font-semibold text-content-primary">
                      {selectedService?.name}
                    </span>
                  </div>
                  {ticket.position != null && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-xs text-content-tertiary">
                        {t("position")}
                      </span>
                      <span className="text-sm font-semibold text-content-primary">
                        #{ticket.position}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs text-content-tertiary">
                      {t("status")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600">
                      <Clock size={10} />
                      {t("waiting")}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Track ticket button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6"
              >
                <button
                  onClick={() => router.push(`/ticket/${ticket.publicId}`)}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary px-8 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-strong hover:brightness-110 active:scale-[0.98]"
                >
                  {t("trackTicket")}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer branding */}
      <footer className="pb-8 text-center">
        <p className="text-xs text-content-tertiary/60">
          Powered by <span className="font-semibold">QueuePro</span>
        </p>
      </footer>
    </div>
  );
}
