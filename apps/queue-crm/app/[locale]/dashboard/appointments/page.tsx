"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  Clock,
  User,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
  Ban,
  Sparkles,
  Zap,
  Timer,
  DollarSign,
  TrendingUp,
  FileText,
  CircleDot,
} from "lucide-react";
import { api } from "../../../../lib/api";
import { useAuthStore } from "../../../../lib/store";
import { Modal } from "../../../../components/ui/modal";
import { PhoneInput } from "../../../../components/ui/phone-input";
import { CustomSelect } from "../../../../components/ui/custom-select";

/* ─── Types ─── */
interface Appointment {
  _id: string;
  customerName: string;
  customerPhone?: string;
  service: string;
  date: string;
  timeSlot: string;
  duration: number;
  status: string;
  notes?: string;
  aiSuggestion?: string;
  earnings?: number;
  createdAt: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

/* ─── Status config with glow ─── */
const STATUS_CONFIG: Record<
  string,
  {
    bg: string;
    text: string;
    icon: React.ComponentType<any>;
    glow?: string;
    bar: string;
  }
> = {
  PENDING: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    icon: Clock,
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.08)]",
    bar: "bg-amber-400",
  },
  CONFIRMED: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    icon: CheckCircle2,
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.08)]",
    bar: "bg-blue-400",
  },
  IN_PROGRESS: {
    bg: "bg-accent-primary/10",
    text: "text-accent-primary",
    icon: PlayCircle,
    glow: "shadow-glow",
    bar: "bg-gradient-to-b from-accent-primary to-accent-secondary",
  },
  COMPLETED: {
    bg: "bg-status-success/10",
    text: "text-status-success",
    icon: CheckCircle2,
    glow: "shadow-[0_0_15px_rgba(34,197,94,0.06)]",
    bar: "bg-status-success",
  },
  CANCELLED: {
    bg: "bg-surface-tertiary/60",
    text: "text-content-tertiary",
    icon: XCircle,
    bar: "bg-surface-tertiary",
  },
  NO_SHOW: {
    bg: "bg-status-error/10",
    text: "text-status-error",
    icon: Ban,
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.06)]",
    bar: "bg-status-error",
  },
};

/* ─────────────────────────────────────────────────
   Localized Inline Calendar
   ───────────────────────────────────────────────── */
function LocalizedCalendar({
  selectedDate,
  onSelect,
  locale,
  t,
  disabledDays,
  minDate,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  disabledDays?: Set<number>;
  minDate?: string;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const localeMap: Record<string, string> = {
    uz: "uz-UZ",
    ru: "ru-RU",
    en: "en-US",
  };
  const intlLocale = localeMap[locale] || "en-US";

  /* Weekday headers (Mon‑Sun) */
  const dayHeaders = useMemo(() => {
    const base = new Date(2024, 0, 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return d.toLocaleDateString(intlLocale, { weekday: "short" }).slice(0, 2);
    });
  }, [intlLocale]);

  /* Month + year label */
  const monthLabel = useMemo(
    () =>
      viewDate.toLocaleDateString(intlLocale, {
        month: "long",
        year: "numeric",
      }),
    [viewDate, intlLocale],
  );

  /* Build 6-row grid */
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    let offset = first.getDay() - 1;
    if (offset < 0) offset = 6;

    const days: { date: Date; inMonth: boolean }[] = [];

    for (let i = offset - 1; i >= 0; i--)
      days.push({ date: new Date(year, month, -i), inMonth: false });

    for (let i = 1; i <= last.getDate(); i++)
      days.push({ date: new Date(year, month, i), inMonth: true });

    const rem = 42 - days.length;
    for (let i = 1; i <= rem; i++)
      days.push({ date: new Date(year, month + 1, i), inMonth: false });

    return days;
  }, [viewDate]);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const todayStr = fmt(new Date());

  return (
    <div className="rounded-2xl border border-surface-tertiary/80 bg-surface-elevated/95 p-4 shadow-large backdrop-blur-xl">
      {/* Nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() =>
            setViewDate(
              new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-xl text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-content-primary capitalize">
          {monthLabel}
        </span>
        <button
          onClick={() =>
            setViewDate(
              new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-xl text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {dayHeaders.map((d, i) => (
          <div
            key={i}
            className="py-1 text-center text-[10px] font-bold uppercase tracking-widest text-content-tertiary/70"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map(({ date, inMonth }, i) => {
          const ds = fmt(date);
          const isSel = ds === selectedDate;
          const isToday = ds === todayStr;

          /* js getDay(): 0=Sun … 6=Sat → we map to our set where 0=Mon…6=Sun */
          const jsDow = date.getDay(); // 0=Sun
          const isoDow = jsDow === 0 ? 6 : jsDow - 1; // 0=Mon…6=Sun
          const isClosedDay = disabledDays?.has(isoDow) ?? false;
          const isPast = minDate ? ds < minDate : false;
          const isDisabled = !inMonth || isClosedDay || isPast;

          return (
            <button
              key={i}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  if (inMonth) onSelect(ds);
                  else {
                    setViewDate(
                      new Date(date.getFullYear(), date.getMonth(), 1),
                    );
                    onSelect(ds);
                  }
                }
              }}
              className={`relative flex h-9 w-full items-center justify-center rounded-xl text-xs font-medium transition-all duration-200 ${
                isDisabled
                  ? "text-content-tertiary/20 cursor-not-allowed"
                  : isSel
                    ? "bg-gradient-to-br from-accent-primary to-accent-secondary text-white shadow-glow scale-[1.08] font-bold"
                    : isToday && inMonth
                      ? "bg-accent-primary/10 text-accent-primary font-bold ring-1 ring-accent-primary/20"
                      : "text-content-primary hover:bg-surface-secondary/80"
              }`}
            >
              {date.getDate()}
              {isToday && !isSel && !isDisabled && (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-accent-primary/50" />
              )}
              {isClosedDay && inMonth && !isPast && (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-content-tertiary/30" />
              )}
            </button>
          );
        })}
      </div>

      {/* Today shortcut — only if no minDate constraint or today >= minDate */}
      {selectedDate !== todayStr && (!minDate || todayStr >= minDate) && (
        <button
          onClick={() => {
            onSelect(todayStr);
            setViewDate(
              new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            );
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent-primary/8 py-2 text-xs font-bold text-accent-primary transition-colors hover:bg-accent-primary/15"
        >
          <Calendar size={12} />
          {t("today")}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Futuristic Appointment Card
   ───────────────────────────────────────────────── */
function AppointmentCard({
  appointment,
  index,
  onStatusChange,
  onCancel,
  onComplete,
  t,
  tc,
}: {
  appointment: Appointment;
  index: number;
  onStatusChange: (id: string, status: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  const cfg = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;
  const isActive = !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
    appointment.status,
  );
  const isInProgress = appointment.status === "IN_PROGRESS";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        delay: index * 0.04,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isActive
          ? `border-surface-tertiary/80 bg-surface-elevated hover:border-accent-primary/15 ${cfg.glow || ""}`
          : "border-surface-tertiary/40 bg-surface-secondary/30"
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 h-full w-[3px] ${cfg.bar} ${
          isInProgress ? "animate-pulse" : ""
        }`}
      />

      <div className="p-4 pl-5">
        {/* Row 1: Time • Duration • Status */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Time pill */}
            <div className="relative">
              <div
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold tracking-tight ${
                  isInProgress
                    ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white"
                    : "bg-surface-secondary text-content-primary"
                }`}
              >
                <Clock size={13} strokeWidth={2.5} />
                {appointment.timeSlot}
              </div>
              {isInProgress && (
                <motion.div
                  className="absolute -inset-[2px] -z-10 rounded-xl bg-accent-primary/20 blur-md"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </div>

            {/* Duration */}
            <span className="flex items-center gap-1 rounded-lg bg-surface-secondary/60 px-2 py-1 text-[11px] font-medium text-content-tertiary">
              <Timer size={10} />
              {appointment.duration}
              {t("min")}
            </span>
          </div>

          {/* Status */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
          >
            <StatusIcon size={11} />
            {t(`status_${appointment.status}`)}
          </div>
        </div>

        {/* Row 2: Customer + Service */}
        <div className="min-w-0">
          <h4 className="flex items-center gap-2 text-[15px] font-semibold text-content-primary truncate">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-primary/8">
              <User size={13} className="text-accent-primary" />
            </div>
            {appointment.customerName}
          </h4>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 pl-9">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-content-secondary">
              <Sparkles size={11} className="text-accent-primary/60" />
              {appointment.service}
            </span>
            {appointment.customerPhone && (
              <span className="inline-flex items-center gap-1.5 text-xs text-content-tertiary">
                <Phone size={10} />
                {appointment.customerPhone}
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="mt-2.5 ml-9 flex items-start gap-1.5 rounded-lg bg-surface-secondary/40 px-3 py-2">
            <FileText
              size={11}
              className="mt-0.5 shrink-0 text-content-tertiary/60"
            />
            <p className="text-[11px] text-content-tertiary leading-relaxed line-clamp-2">
              {appointment.notes}
            </p>
          </div>
        )}

        {/* Earnings for completed */}
        {appointment.status === "COMPLETED" &&
          appointment.earnings != null &&
          appointment.earnings > 0 && (
            <div className="mt-2.5 ml-9">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-status-success/8 px-3 py-1.5 text-xs font-bold text-status-success">
                <DollarSign size={12} />
                {appointment.earnings.toLocaleString()}
                <span className="font-normal text-status-success/60">UZS</span>
              </span>
            </div>
          )}

        {/* Action buttons */}
        {isActive && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-surface-tertiary/40 pt-3">
            {appointment.status === "PENDING" && (
              <button
                onClick={() => onStatusChange(appointment._id, "CONFIRMED")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400 transition-all hover:bg-blue-500/20 active:scale-[0.97]"
              >
                <CheckCircle2 size={12} />
                {t("confirm")}
              </button>
            )}
            {(appointment.status === "PENDING" ||
              appointment.status === "CONFIRMED") && (
              <button
                onClick={() => onStatusChange(appointment._id, "IN_PROGRESS")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent-primary/10 px-3.5 py-1.5 text-xs font-semibold text-accent-primary transition-all hover:bg-accent-primary/20 active:scale-[0.97]"
              >
                <Zap size={12} />
                {t("startService")}
              </button>
            )}
            {appointment.status === "IN_PROGRESS" && (
              <button
                onClick={() => onComplete(appointment._id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-status-success to-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.97]"
              >
                <CheckCircle2 size={12} />
                {t("markDone")}
              </button>
            )}
            {appointment.status !== "IN_PROGRESS" && (
              <button
                onClick={() => onCancel(appointment._id)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-status-error/6 px-3 py-1.5 text-xs font-semibold text-status-error/80 transition-all hover:bg-status-error/12 hover:text-status-error active:scale-[0.97]"
              >
                <XCircle size={12} />
                {tc("cancel")}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════
   Main Appointments Page
   ═════════════════════════════════════════════════ */
export default function AppointmentsPage() {
  const t = useTranslations("appointments");
  const tc = useTranslations("common");
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  /* ── State ── */
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  /* Services */
  const [tenantServices, setTenantServices] = useState<string[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [addingService, setAddingService] = useState(false);

  /* Earnings modal */
  const [earningsModal, setEarningsModal] = useState<{
    open: boolean;
    appointmentId: string;
  }>({ open: false, appointmentId: "" });
  const [earningsAmount, setEarningsAmount] = useState("");
  const [savingEarnings, setSavingEarnings] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "+998",
    service: "",
    notes: "",
  });

  /* Modal date picker state — separate from filter date */
  const [modalDate, setModalDate] = useState("");
  const [modalSlots, setModalSlots] = useState<TimeSlot[]>([]);
  const [modalSlotsLoading, setModalSlotsLoading] = useState(false);
  const [showModalCalendar, setShowModalCalendar] = useState(false);
  const modalCalRef = useRef<HTMLDivElement>(null);

  /* Tenant working hours for disabling closed days */
  const [workingHours, setWorkingHours] = useState<
    Record<string, { start: string; end: string; closed?: boolean }>
  >({});

  const calRef = useRef<HTMLDivElement>(null);

  /* ── Locale helpers ── */
  const localeMap: Record<string, string> = {
    uz: "uz-UZ",
    ru: "ru-RU",
    en: "en-US",
  };
  const intlLocale = localeMap[locale] || "en-US";

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(intlLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const isToday = selectedDate === todayStr;

  /* ── Close calendar on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCalendar]);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [appts, slots] = await Promise.all([
        api.appointments.getDaily(selectedDate, token),
        api.appointments.getSlots(selectedDate, token),
      ]);
      setAppointments(Array.isArray(appts) ? appts : []);
      setAvailableSlots(Array.isArray(slots) ? slots : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Fetch tenant services + working hours ── */
  const fetchServices = useCallback(async () => {
    if (!token || !user?.tenantId) return;
    try {
      const tenant = await api.tenants.get(user.tenantId, token);
      setTenantServices(tenant?.soloProfile?.services || []);
      if (tenant?.soloProfile?.workingHours) {
        setWorkingHours(tenant.soloProfile.workingHours);
      }
    } catch (err) {
      console.error("Failed to load services", err);
    }
  }, [token, user?.tenantId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  /* ── Closed days set (0=Mon…6=Sun) ── */
  const DAYS_LIST = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const closedDays = useMemo(() => {
    const s = new Set<number>();
    DAYS_LIST.forEach((day, idx) => {
      if (workingHours[day]?.closed) s.add(idx);
    });
    return s;
  }, [workingHours]);

  /* ── Tomorrow string (min date for modal) ── */
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  /* ── Find next available working day ── */
  const nextAvailableDay = useCallback(
    (from: string) => {
      const d = new Date(from + "T00:00:00");
      for (let i = 0; i < 60; i++) {
        const jsDow = d.getDay();
        const isoDow = jsDow === 0 ? 6 : jsDow - 1;
        if (!closedDays.has(isoDow)) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        }
        d.setDate(d.getDate() + 1);
      }
      return from;
    },
    [closedDays],
  );

  /* ── Fetch slots for modal date ── */
  useEffect(() => {
    if (!token || !modalDate) return;
    let cancelled = false;
    setModalSlotsLoading(true);
    api.appointments
      .getSlots(modalDate, token)
      .then((slots) => {
        if (!cancelled) setModalSlots(Array.isArray(slots) ? slots : []);
      })
      .catch(() => {
        if (!cancelled) setModalSlots([]);
      })
      .finally(() => {
        if (!cancelled) setModalSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, modalDate]);

  /* ── Close modal calendar on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        modalCalRef.current &&
        !modalCalRef.current.contains(e.target as Node)
      ) {
        setShowModalCalendar(false);
      }
    };
    if (showModalCalendar) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModalCalendar]);

  /* ── Add new service inline ── */
  const handleAddService = async () => {
    const trimmed = newServiceName.trim();
    if (!trimmed || !token || !user?.tenantId) return;
    if (tenantServices.some((s) => s.toLowerCase() === trimmed.toLowerCase()))
      return;
    setAddingService(true);
    try {
      const updated = [...tenantServices, trimmed];
      await api.tenants.update(
        user.tenantId,
        { soloProfile: { services: updated } },
        token,
      );
      setTenantServices(updated);
      setForm((f) => ({ ...f, service: trimmed }));
      setNewServiceName("");
      setShowAddService(false);
    } catch (err) {
      console.error("Failed to add service", err);
    } finally {
      setAddingService(false);
    }
  };

  /* ── Navigate date (arrows) ── */
  const navigateDate = (dir: -1 | 1) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + dir);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  /* ── Create ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSlot || !modalDate) return;
    setSaving(true);
    setError("");
    try {
      const appt = await api.appointments.create(
        {
          customerName: form.customerName,
          customerPhone: form.customerPhone || undefined,
          service: form.service,
          date: modalDate,
          timeSlot: selectedSlot,
          notes: form.notes || undefined,
        },
        token,
      );
      /* If the modal date equals the filter date, update in-view data */
      if (modalDate === selectedDate) {
        setAppointments((prev) =>
          [...prev, appt].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)),
        );
        setAvailableSlots((prev) =>
          prev.map((s) =>
            s.time === selectedSlot ? { ...s, available: false } : s,
          ),
        );
      } else {
        /* Switch the filter to the new date so user sees the new appointment */
        setSelectedDate(modalDate);
      }
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to create appointment");
    } finally {
      setSaving(false);
    }
  };

  /* ── Status change ── */
  const handleStatusChange = async (id: string, status: string) => {
    if (!token) return;
    try {
      const updated = await api.appointments.update(id, { status }, token);
      setAppointments((prev) => prev.map((a) => (a._id === id ? updated : a)));
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Complete (opens earnings modal) ── */
  const handleComplete = (id: string) => {
    setEarningsModal({ open: true, appointmentId: id });
    setEarningsAmount("");
  };

  const submitCompletion = async () => {
    if (!token) return;
    setSavingEarnings(true);
    try {
      const payload: Record<string, any> = { status: "COMPLETED" };
      const amt = Number(earningsAmount);
      if (amt > 0) payload.earnings = amt;
      const updated = await api.appointments.update(
        earningsModal.appointmentId,
        payload,
        token,
      );
      setAppointments((prev) =>
        prev.map((a) => (a._id === earningsModal.appointmentId ? updated : a)),
      );
      setEarningsModal({ open: false, appointmentId: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEarnings(false);
    }
  };

  const skipAndComplete = async () => {
    if (!token) return;
    setSavingEarnings(true);
    try {
      const updated = await api.appointments.update(
        earningsModal.appointmentId,
        { status: "COMPLETED" },
        token,
      );
      setAppointments((prev) =>
        prev.map((a) => (a._id === earningsModal.appointmentId ? updated : a)),
      );
      setEarningsModal({ open: false, appointmentId: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEarnings(false);
    }
  };

  /* ── Cancel ── */
  const handleCancel = async (id: string) => {
    if (!token) return;
    try {
      await api.appointments.cancel(id, token);
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "CANCELLED" } : a)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Reset ── */
  const resetForm = () => {
    setForm({
      customerName: "",
      customerPhone: "+998",
      service: "",
      notes: "",
    });
    setSelectedSlot(null);
    setError("");
    setModalDate("");
    setModalSlots([]);
    setShowModalCalendar(false);
  };

  /* ── Derived ── */
  const activeAppointments = appointments.filter(
    (a) => !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(a.status),
  );
  const completedAppointments = appointments.filter((a) =>
    ["COMPLETED", "NO_SHOW"].includes(a.status),
  );
  const cancelledAppointments = appointments.filter(
    (a) => a.status === "CANCELLED",
  );
  const totalEarnings = appointments
    .filter((a) => a.status === "COMPLETED" && a.earnings)
    .reduce((sum, a) => sum + (a.earnings || 0), 0);
  const freeSlots = availableSlots.filter((s) => s.available).length;

  /* ═════════════════════ RENDER ═════════════════════ */
  return (
    <div>
      {/* ──── Header ──── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {t("title")}
          </h1>
          <p className="mt-0.5 text-sm text-content-tertiary">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={() => {
            const next = nextAvailableDay(tomorrowStr);
            setModalDate(next);
            setSelectedSlot(null);
            setShowCreateModal(true);
            setError("");
          }}
          className="btn-primary"
        >
          <Plus size={16} />
          {t("newAppointment")}
        </button>
      </div>

      {/* ──── Date Navigator + Calendar Popup ──── */}
      <div className="relative mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-content-secondary transition-all hover:bg-surface-tertiary active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => setShowCalendar((v) => !v)}
            className="group flex flex-1 items-center justify-center gap-2.5 rounded-2xl border border-surface-tertiary bg-surface-elevated px-5 py-2.5 transition-all hover:border-accent-primary/20 hover:shadow-soft"
          >
            <Calendar
              size={16}
              className="text-accent-primary transition-transform group-hover:scale-110"
            />
            <span className="font-semibold text-content-primary capitalize">
              {formatDateDisplay(selectedDate)}
            </span>
            {isToday && (
              <span className="rounded-md bg-accent-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-accent-primary">
                {t("today")}
              </span>
            )}
          </button>

          <button
            onClick={() => navigateDate(1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-content-secondary transition-all hover:bg-surface-tertiary active:scale-95"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dropdown calendar */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              ref={calRef}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-full z-30 mt-2 w-[320px] -translate-x-1/2"
            >
              <LocalizedCalendar
                selectedDate={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setShowCalendar(false);
                }}
                locale={locale}
                t={t}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ──── Stats Row ──── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: t("totalToday"),
            value: appointments.filter((a) => a.status !== "CANCELLED").length,
            accent: "text-content-primary",
            dot: "bg-accent-primary",
          },
          {
            label: t("upcoming"),
            value: activeAppointments.length,
            accent: "text-accent-primary",
            dot: "bg-accent-primary",
          },
          {
            label: t("slotsAvailable"),
            value: freeSlots,
            accent: "text-status-success",
            dot: "bg-status-success",
          },
          {
            label: t("todayEarnings"),
            value: totalEarnings > 0 ? totalEarnings.toLocaleString() : "—",
            accent: "text-status-success",
            dot: "bg-status-success",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="card group relative overflow-hidden px-4 py-3"
          >
            <div className="absolute -right-2 -top-2 h-10 w-10 rounded-full bg-accent-primary/5 transition-transform group-hover:scale-[2]" />
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary">
                {stat.label}
              </p>
            </div>
            <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ──── Loading ──── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary opacity-20 animate-ping" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary">
                <Loader2 size={22} className="text-white animate-spin" />
              </div>
            </div>
            <p className="text-xs font-medium text-content-tertiary">
              {tc("loading")}
            </p>
          </div>
        </div>
      )}

      {/* ──── Appointment Lists ──── */}
      {!loading && (
        <div className="space-y-8">
          {/* Active */}
          {activeAppointments.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CircleDot
                  size={14}
                  className="text-accent-primary animate-pulse"
                />
                <h3 className="text-xs font-bold uppercase tracking-widest text-content-tertiary">
                  {t("upcoming")} ({activeAppointments.length})
                </h3>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {activeAppointments.map((appt, i) => (
                    <AppointmentCard
                      key={appt._id}
                      appointment={appt}
                      index={i}
                      onStatusChange={handleStatusChange}
                      onCancel={handleCancel}
                      onComplete={handleComplete}
                      t={t}
                      tc={tc}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Completed */}
          {completedAppointments.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-status-success" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-content-tertiary">
                  {t("completed")} ({completedAppointments.length})
                </h3>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {completedAppointments.map((appt, i) => (
                    <AppointmentCard
                      key={appt._id}
                      appointment={appt}
                      index={i}
                      onStatusChange={handleStatusChange}
                      onCancel={handleCancel}
                      onComplete={handleComplete}
                      t={t}
                      tc={tc}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Cancelled */}
          {cancelledAppointments.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <XCircle size={14} className="text-content-tertiary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-content-tertiary">
                  {t("status_CANCELLED")} ({cancelledAppointments.length})
                </h3>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {cancelledAppointments.map((appt, i) => (
                    <AppointmentCard
                      key={appt._id}
                      appointment={appt}
                      index={i}
                      onStatusChange={handleStatusChange}
                      onCancel={handleCancel}
                      onComplete={handleComplete}
                      t={t}
                      tc={tc}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Empty state */}
          {appointments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 text-center"
            >
              <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-primary/15 to-accent-secondary/10 blur-md" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
                  <Calendar size={34} className="text-accent-primary" />
                </div>
              </div>
              <p className="text-lg font-bold text-content-primary">
                {t("emptyTitle")}
              </p>
              <p className="mt-1 text-sm text-content-tertiary">
                {t("emptyDesc")}
              </p>
              <button
                onClick={() => {
                  const next = nextAvailableDay(tomorrowStr);
                  setModalDate(next);
                  setSelectedSlot(null);
                  setShowCreateModal(true);
                }}
                className="btn-primary mt-5 mx-auto"
              >
                <Plus size={16} />
                {t("newAppointment")}
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* ──── Create Appointment Modal ──── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={t("newAppointment")}
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error"
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {t("customerName")} *
              </label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                required
                className="input-field"
                placeholder={t("customerNamePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {t("customerPhone")}
              </label>
              <PhoneInput
                value={form.customerPhone}
                onChange={(v) => setForm({ ...form, customerPhone: v })}
              />
            </div>
          </div>

          <div>
            <CustomSelect
              label={`${t("service")} *`}
              options={tenantServices.map((s) => ({
                value: s,
                label: s,
                icon: <Sparkles size={14} className="text-accent-primary/60" />,
              }))}
              value={form.service}
              onChange={(v) => setForm({ ...form, service: v })}
              placeholder={t("selectService")}
              icon={<Sparkles size={15} />}
              emptyMessage={t("noServices")}
              footerAction={{
                label: t("addService"),
                icon: <Plus size={14} />,
                onClick: () => {
                  setShowAddService(true);
                  setNewServiceName("");
                },
              }}
            />
            {/* Inline add service */}
            <AnimatePresence>
              {showAddService && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddService();
                        }
                        if (e.key === "Escape") setShowAddService(false);
                      }}
                      placeholder={t("newServicePlaceholder")}
                      className="input-field flex-1 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddService}
                      disabled={!newServiceName.trim() || addingService}
                      className="btn-primary px-3 py-2 text-xs"
                    >
                      {addingService ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddService(false)}
                      className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-surface-secondary text-content-tertiary transition-colors hover:bg-surface-tertiary"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Date Picker (future only, working days) ── */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("selectDate")} *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModalCalendar((v) => !v)}
                className="group flex w-full items-center gap-2.5 rounded-xl border border-surface-tertiary bg-surface-secondary/50 px-4 py-2.5 text-left transition-all hover:border-accent-primary/20"
              >
                <Calendar size={15} className="text-accent-primary" />
                <span className="flex-1 text-sm font-medium text-content-primary capitalize">
                  {modalDate
                    ? new Date(modalDate + "T00:00:00").toLocaleDateString(
                        intlLocale,
                        {
                          weekday: "short",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )
                    : t("selectDate")}
                </span>
                <ChevronRight
                  size={14}
                  className="text-content-tertiary rotate-90"
                />
              </button>
              <AnimatePresence>
                {showModalCalendar && (
                  <motion.div
                    ref={modalCalRef}
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 right-0 top-full z-30 mt-1.5"
                  >
                    <LocalizedCalendar
                      selectedDate={modalDate}
                      onSelect={(d) => {
                        setModalDate(d);
                        setSelectedSlot(null);
                        setShowModalCalendar(false);
                      }}
                      locale={locale}
                      t={t}
                      disabledDays={closedDays}
                      minDate={tomorrowStr}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Time slot grid — uses modalSlots */}
          <div>
            <label className="mb-2 block text-sm font-medium text-content-secondary">
              {t("selectTime")} *
            </label>
            {modalSlotsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2
                  size={18}
                  className="animate-spin text-accent-primary"
                />
              </div>
            ) : modalSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {modalSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${
                      selectedSlot === slot.time
                        ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-glow scale-[1.05]"
                        : slot.available
                          ? "bg-surface-secondary text-content-primary hover:bg-surface-tertiary hover:scale-[1.02]"
                          : "bg-surface-tertiary/40 text-content-tertiary/40 line-through cursor-not-allowed"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-surface-secondary/60 py-4 text-center text-sm text-content-tertiary italic">
                {t("noSlotsAvailable")}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder={t("notesPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || !selectedSlot || !form.service || !modalDate}
              className="btn-primary"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {saving ? tc("loading") : t("bookSlot")}
            </button>
          </div>
        </form>
      </Modal>

      {/* ──── Earnings Modal ──── */}
      <Modal
        isOpen={earningsModal.open}
        onClose={() => setEarningsModal({ open: false, appointmentId: "" })}
        title={t("earningsTitle")}
        size="sm"
      >
        <div className="space-y-5">
          {/* Visual */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-2 rounded-3xl bg-status-success/10 blur-lg" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-status-success/20 to-emerald-500/10">
                <TrendingUp size={28} className="text-status-success" />
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-content-secondary leading-relaxed">
            {t("earningsDesc")}
          </p>

          {/* Input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("earningsAmount")}
            </label>
            <div className="relative">
              <DollarSign
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary"
              />
              <input
                type="number"
                value={earningsAmount}
                onChange={(e) => setEarningsAmount(e.target.value)}
                placeholder={t("earningsPlaceholder")}
                className="input-field pl-10 text-lg font-semibold"
                min="0"
                step="1000"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitCompletion();
                  }
                }}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-content-tertiary">
                UZS
              </span>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-content-tertiary">
              <TrendingUp
                size={11}
                className="mt-0.5 shrink-0 text-accent-primary/60"
              />
              {t("earningsHint")}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={skipAndComplete}
              disabled={savingEarnings}
              className="btn-secondary flex-1 justify-center"
            >
              {t("skipAndFinish")}
            </button>
            <button
              onClick={submitCompletion}
              disabled={savingEarnings}
              className="btn-primary flex-1 justify-center"
            >
              {savingEarnings ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {t("saveAndFinish")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
