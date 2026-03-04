"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Settings,
  Clock,
  Save,
  Loader2,
  Check,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { useAuthStore } from "../../../../lib/store";
import { api } from "../../../../lib/api";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function ManagerSettingsPage() {
  const t = useTranslations("manager");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    timezone: "Asia/Tashkent",
    workingHours: "09:00 - 18:00",
    maxDailyTickets: 0,
    avgTimePerClient: 15,
  });

  const [schedule, setSchedule] = useState<
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
    async function fetchBranch() {
      if (!token || !user?.branchId) return;
      try {
        const data = await api.branches.get(user.branchId, token);
        setBranch(data);
        setForm({
          name: data.name || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          timezone: data.timezone || "Asia/Tashkent",
          workingHours: data.workingHours || "09:00 - 18:00",
          maxDailyTickets: data.maxDailyTickets || 0,
          avgTimePerClient: data.avgTimePerClient || 15,
        });
        if (data.schedule) {
          setSchedule(data.schedule);
        }
      } catch {}
      setLoading(false);
    }
    fetchBranch();
  }, [token, user]);

  const handleSave = async () => {
    if (!token || !user?.branchId) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.branches.update(
        user.branchId,
        {
          ...form,
          schedule,
        },
        token,
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {t("settingsTitle")}
          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            {t("settingsSubtitle")}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary gap-2"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? tc("saving") : saved ? t("saved") : tc("save")}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
          <Settings size={18} className="text-accent-primary" />
          {t("basicInfo")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("branchName")}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary flex items-center gap-1.5">
              <MapPin size={13} />
              {t("address")}
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary flex items-center gap-1.5">
              <Phone size={13} />
              {t("phone")}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary flex items-center gap-1.5">
              <Mail size={13} />
              {t("emailOptional")}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="input-field"
            />
          </div>
        </div>
      </motion.div>

      {/* Operations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
          <Globe size={18} className="text-accent-primary" />
          {t("operations")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("timezone")}
            </label>
            <select
              value={form.timezone}
              onChange={(e) =>
                setForm((f) => ({ ...f, timezone: e.target.value }))
              }
              className="input-field"
            >
              {[
                "Asia/Tashkent",
                "Asia/Samarkand",
                "Asia/Almaty",
                "Asia/Dushanbe",
                "Europe/Moscow",
                "Asia/Dubai",
              ].map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("maxDailyTickets")}
            </label>
            <input
              type="number"
              value={form.maxDailyTickets}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxDailyTickets: parseInt(e.target.value) || 0,
                }))
              }
              className="input-field"
              min={0}
            />
            <p className="mt-1 text-xs text-content-tertiary">
              {t("maxDailyTicketsHint")}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("avgTimePerClient")}
            </label>
            <input
              type="number"
              value={form.avgTimePerClient}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  avgTimePerClient: parseInt(e.target.value) || 15,
                }))
              }
              className="input-field"
              min={1}
              max={120}
            />
            <p className="mt-1 text-xs text-content-tertiary">
              {t("avgTimePerClientHint")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
          <Clock size={18} className="text-accent-primary" />
          {t("schedule")}
        </h2>
        <div className="space-y-2">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3 text-sm">
              <button
                type="button"
                onClick={() =>
                  setSchedule((prev) => ({
                    ...prev,
                    [day]: { ...prev[day], closed: !prev[day].closed },
                  }))
                }
                className={`w-24 shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  schedule[day].closed
                    ? "bg-surface-tertiary text-content-tertiary line-through"
                    : "bg-accent-primary/10 text-accent-primary"
                }`}
              >
                {t(`day_${day}`)}
              </button>
              {!schedule[day].closed ? (
                <>
                  <input
                    type="time"
                    value={schedule[day].start}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], start: e.target.value },
                      }))
                    }
                    className="input-field h-9 w-28 text-xs"
                  />
                  <span className="text-content-tertiary">–</span>
                  <input
                    type="time"
                    value={schedule[day].end}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], end: e.target.value },
                      }))
                    }
                    className="input-field h-9 w-28 text-xs"
                  />
                </>
              ) : (
                <span className="text-xs text-content-tertiary italic">
                  {t("closed")}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
