"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Monitor,
  MapPin,
  Layers,
  ListChecks,
  UserCheck,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Link, useRouter } from "../../../../../i18n/navigation";
import { api } from "../../../../../lib/api";
import { useAuthStore } from "../../../../../lib/store";
import {
  ServicesPicker,
  ServicesTrigger,
} from "../../../../../components/ui/services-picker";
import {
  LanguagePicker,
  LanguageTrigger,
} from "../../../../../components/ui/language-picker";

interface Branch {
  _id: string;
  name: string;
  isActive: boolean;
}

interface Queue {
  _id: string;
  name: string;
  branchId: string;
}

interface Service {
  _id: string;
  name: string;
  prefix?: string;
  isActive?: boolean;
  branchId?: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  branchId?: string;
  isActive: boolean;
}

export default function NewCounterPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("counters");
  const tcom = useTranslations("common");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showServicesPicker, setShowServicesPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const [form, setForm] = useState({
    name: "",
    counterNumber: 0,
    description: "",
    branchId: "",
    location: "",
    floor: "",
    serviceIds: [] as string[],
    languages: [] as string[],
    maxConcurrentTickets: 1,
    priority: 0,
    tags: "",
    queueIds: [] as string[],
    employeeId: "",
  });

  const fetchBranches = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.branches.list(user.tenantId, token);
      const list = Array.isArray(data) ? data : [];
      setBranches(list);
      if (list.length > 0 && !form.branchId) {
        setForm((prev) => ({ ...prev, branchId: list[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId, token]);

  const fetchQueues = useCallback(async () => {
    if (!user?.tenantId) return;
    try {
      const data = await api.queues.list({ tenantId: user.tenantId });
      setQueues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId]);

  const fetchServices = useCallback(async () => {
    if (!user?.tenantId) return;
    try {
      const data = await api.queues.list({ tenantId: user.tenantId });
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId]);

  const fetchEmployees = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.employees.list({ tenantId: user.tenantId }, token);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId, token]);

  useEffect(() => {
    fetchBranches();
    fetchQueues();
    fetchServices();
    fetchEmployees();
  }, [fetchBranches, fetchQueues, fetchServices, fetchEmployees]);

  const parseCSV = (val: string): string[] =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (!form.employeeId) {
      setError(tc("employeeRequired"));
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        branchId: form.branchId,
        tenantId: user?.tenantId,
        queueIds: form.queueIds,
        employeeId: form.employeeId,
      };
      if (form.counterNumber > 0) payload.counterNumber = form.counterNumber;
      if (form.description) payload.description = form.description;
      if (form.location) payload.location = form.location;
      if (form.floor) payload.floor = form.floor;
      if (form.languages.length > 0) payload.languages = form.languages;
      if (form.maxConcurrentTickets > 0)
        payload.maxConcurrentTickets = form.maxConcurrentTickets;
      if (form.priority > 0) payload.priority = form.priority;
      if (form.tags) payload.tags = parseCSV(form.tags);

      await api.counters.create(payload, token);

      router.push("/dashboard/counters");
    } catch (err: any) {
      setError(err.message || "Failed to create counter");
    } finally {
      setSaving(false);
    }
  };

  const filteredQueues = queues.filter((q) => q.branchId === form.branchId);

  const filteredServices = services.filter(
    (s) => !s.branchId || s.branchId === form.branchId,
  );

  // Filter employees: active, has phone, and optionally matching branch
  const availableEmployees = employees.filter(
    (e) =>
      e.isActive && e.phone && (!e.branchId || e.branchId === form.branchId),
  );

  const toggleQueueId = (queueId: string) => {
    const ids = form.queueIds.includes(queueId)
      ? form.queueIds.filter((id) => id !== queueId)
      : [...form.queueIds, queueId];
    setForm({ ...form, queueIds: ids });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/counters"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-content-tertiary transition-colors hover:text-content-primary"
        >
          <ArrowLeft size={16} />
          {tcom("back")}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-primary/8">
            <Monitor size={22} className="text-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              {t("createCounter")}
            </h1>
            <p className="mt-0.5 text-sm text-content-tertiary">
              {tc("subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error"
            >
              {error}
            </motion.div>
          )}

          {branches.length === 0 && (
            <div className="rounded-xl bg-status-warning/8 px-4 py-3 text-sm font-medium text-status-warning">
              {tc("noBranches")}
            </div>
          )}

          {/* ─── Basic Info ─── */}
          <section className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-content-primary">
              <Monitor size={18} className="text-accent-primary" />
              {tc("basicInfo")}
            </h2>

            {/* Branch Selector */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {tc("selectBranch")} *
              </label>
              <select
                value={form.branchId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    branchId: e.target.value,
                    queueIds: [],
                    employeeId: "",
                  })
                }
                required
                className="input-field"
              >
                <option value="" disabled>
                  {tc("selectBranch")}
                </option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name & Counter Number */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                  {t("counterName")} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="input-field"
                  placeholder={tc("namePlaceholder")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                  {tc("counterNumber")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.counterNumber || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      counterNumber: parseInt(e.target.value) || 0,
                    })
                  }
                  className="input-field"
                  placeholder={tc("counterNumberPlaceholder")}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {tc("description")}
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="input-field min-h-[80px] resize-y"
                placeholder={tc("descriptionPlaceholder")}
                rows={3}
              />
            </div>
          </section>

          {/* ─── Employee Assignment ─── */}
          <section className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-content-primary">
              <UserCheck size={18} className="text-accent-primary" />
              {tc("assignEmployee")} *
            </h2>
            <p className="mb-3 text-xs text-content-tertiary">
              {tc("assignEmployeeDesc")}
            </p>

            {availableEmployees.length > 0 ? (
              <div className="space-y-2">
                {availableEmployees.map((emp) => (
                  <button
                    key={emp._id}
                    type="button"
                    onClick={() => setForm({ ...form, employeeId: emp._id })}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                      form.employeeId === emp._id
                        ? "bg-accent-primary/10 ring-2 ring-accent-primary"
                        : "bg-surface-secondary hover:bg-surface-tertiary"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                        form.employeeId === emp._id
                          ? "bg-accent-primary text-white"
                          : "bg-surface-tertiary text-content-secondary"
                      }`}
                    >
                      {emp.firstName[0]}
                      {emp.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-content-primary">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-content-tertiary">
                        <span className="flex items-center gap-1">
                          <Phone size={10} />
                          {emp.phone}
                        </span>
                        <span>{emp.email}</span>
                      </div>
                    </div>
                    {form.employeeId === emp._id && (
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-accent-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-status-warning/8 px-4 py-3 text-sm font-medium text-status-warning">
                {tc("noEmployeesAvailable")}
              </div>
            )}
          </section>

          {/* ─── Location ─── */}
          <section className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-content-primary">
              <MapPin size={18} className="text-accent-primary" />
              {tc("locationSection")}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                  {tc("location")}
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="input-field"
                  placeholder={tc("locationPlaceholder")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                  {tc("floor")}
                </label>
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  className="input-field"
                  placeholder={tc("floorPlaceholder")}
                />
              </div>
            </div>
          </section>

          {/* ─── Service Configuration ─── */}
          <section className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-content-primary">
              <Layers size={18} className="text-accent-primary" />
              {tc("serviceConfig")}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ServicesTrigger
                selected={form.serviceIds}
                services={filteredServices}
                onClick={() => setShowServicesPicker(true)}
              />
              <LanguageTrigger
                selected={form.languages}
                onClick={() => setShowLanguagePicker(true)}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                  {tc("maxConcurrentTickets")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxConcurrentTickets || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxConcurrentTickets: parseInt(e.target.value) || 1,
                    })
                  }
                  className="input-field"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                  {tc("priority")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.priority || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  className="input-field"
                  placeholder={tc("priorityPlaceholder")}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {tc("tags")}
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="input-field"
                placeholder={tc("tagsPlaceholder")}
              />
              <p className="mt-1 text-xs text-content-tertiary">
                {tc("commaSeparatedHint")}
              </p>
            </div>
          </section>

          {/* ─── Queue Assignment ─── */}
          <section className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-content-primary">
              <ListChecks size={18} className="text-accent-primary" />
              {tc("assignQueues")}
            </h2>
            {filteredQueues.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {filteredQueues.map((q) => (
                  <button
                    key={q._id}
                    type="button"
                    onClick={() => toggleQueueId(q._id)}
                    className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                      form.queueIds.includes(q._id)
                        ? "bg-accent-primary text-white shadow-sm"
                        : "bg-surface-secondary text-content-secondary hover:bg-surface-tertiary"
                    }`}
                  >
                    {q.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-content-tertiary">
                {tc("noQueuesAvailable")}
              </p>
            )}
          </section>

          {/* ─── Actions ─── */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Link href="/dashboard/counters" className="btn-secondary">
              {tcom("cancel")}
            </Link>
            <button
              type="submit"
              disabled={saving || branches.length === 0 || !form.employeeId}
              className="btn-primary"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {saving ? tcom("loading") : tcom("create")}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Services Picker Modal/Drawer */}
      <ServicesPicker
        isOpen={showServicesPicker}
        onClose={() => setShowServicesPicker(false)}
        services={filteredServices}
        selected={form.serviceIds}
        onSelectionChange={(ids) => setForm({ ...form, serviceIds: ids })}
      />

      {/* Language Picker Modal/Drawer */}
      <LanguagePicker
        isOpen={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        selected={form.languages}
        onSelectionChange={(codes) => setForm({ ...form, languages: codes })}
      />
    </div>
  );
}
