"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Monitor,
  MapPin,
  Layers,
  ListChecks,
  ToggleLeft,
  ToggleRight,
  Save,
  CheckCircle2,
  XCircle,
  UserCheck,
  Phone,
  Building2,
} from "lucide-react";
import { Link, useRouter } from "../../../../../../i18n/navigation";
import { api } from "../../../../../../lib/api";
import { useAuthStore } from "../../../../../../lib/store";
import {
  ServicesPicker,
  ServicesTrigger,
} from "../../../../../../components/ui/services-picker";
import {
  LanguagePicker,
  LanguageTrigger,
} from "../../../../../../components/ui/language-picker";

interface Counter {
  _id: string;
  tenantId: string;
  branchId: string;
  name: string;
  counterNumber?: number;
  description?: string;
  location?: string;
  floor?: string;
  serviceTypes?: string[];
  languages?: string[];
  maxConcurrentTickets?: number;
  priority?: number;
  tags?: string[];
  queueIds: string[];
  isActive: boolean;
  currentTicketId?: string;
  staffId?: string;
  employeeId?: any;
  createdAt: string;
  updatedAt: string;
}

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

export default function EditCounterPage() {
  const params = useParams();
  const counterId = params.id as string;
  const t = useTranslations("dashboard");
  const tc = useTranslations("counters");
  const tcom = useTranslations("common");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [counter, setCounter] = useState<Counter | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
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

  const fetchCounter = useCallback(async () => {
    if (!token || !counterId) return;
    try {
      const data = await api.counters.get(counterId, token);
      setCounter(data);
      const empId =
        typeof data.employeeId === "object" && data.employeeId?._id
          ? data.employeeId._id
          : data.employeeId || "";
      setForm({
        name: data.name,
        counterNumber: data.counterNumber || 0,
        description: data.description || "",
        branchId: data.branchId,
        location: data.location || "",
        floor: data.floor || "",
        serviceIds: data.serviceTypes || [],
        languages: data.languages || [],
        maxConcurrentTickets: data.maxConcurrentTickets || 1,
        priority: data.priority || 0,
        tags: (data.tags || []).join(", "),
        queueIds: data.queueIds || [],
        employeeId: empId,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, counterId]);

  const fetchBranches = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.branches.list(user.tenantId, token);
      setBranches(Array.isArray(data) ? data : []);
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
    fetchCounter();
    fetchBranches();
    fetchQueues();
    fetchServices();
    fetchEmployees();
  }, [fetchCounter, fetchBranches, fetchQueues, fetchServices, fetchEmployees]);

  const parseCSV = (val: string): string[] =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !counterId) return;
    setError(null);

    if (!form.employeeId) {
      setError(tc("employeeRequired"));
      return;
    }

    setSaving(true);
    try {
      await api.counters.update(
        counterId,
        {
          name: form.name,
          counterNumber: form.counterNumber || undefined,
          description: form.description,
          location: form.location,
          floor: form.floor,
          languages: form.languages,
          maxConcurrentTickets: form.maxConcurrentTickets,
          priority: form.priority,
          tags: parseCSV(form.tags),
          queueIds: form.queueIds,
          employeeId: form.employeeId,
        },
        token,
      );

      router.push("/dashboard/counters");
    } catch (err: any) {
      setError(err.message || "Failed to update counter");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!token || !counter) return;
    setToggling(true);
    try {
      const result = await api.counters.update(
        counter._id,
        { isActive: !counter.isActive },
        token,
      );
      setCounter(result.counter || result);
    } catch (err: any) {
      setError(err.message || "Failed to update counter status");
    } finally {
      setToggling(false);
    }
  };

  const filteredQueues = queues.filter((q) => q.branchId === form.branchId);

  const filteredServices = services.filter(
    (s) => !s.branchId || s.branchId === form.branchId,
  );

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

  const getBranchName = (branchId: string) =>
    branches.find((b) => b._id === branchId)?.name || branchId;

  // Determine the currently assigned employee (from populated data)
  const currentAssignedEmployee =
    typeof counter?.employeeId === "object" && counter?.employeeId
      ? counter.employeeId
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-accent-primary" />
      </div>
    );
  }

  if (!counter) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-secondary">
          <Monitor size={28} className="text-content-tertiary" />
        </div>
        <p className="text-content-secondary font-medium">Counter not found</p>
        <Link
          href="/dashboard/counters"
          className="btn-primary mt-4 inline-flex"
        >
          <ArrowLeft size={16} />
          {tcom("back")}
        </Link>
      </div>
    );
  }

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-primary/8">
              <Monitor size={22} className="text-accent-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-content-primary">
                {tc("editCounter")}
              </h1>
              <p className="mt-0.5 text-sm text-content-tertiary">
                {counter.name}
                {counter.counterNumber ? ` #${counter.counterNumber}` : ""}
              </p>
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              counter.isActive
                ? "bg-status-success/10 text-status-success"
                : "bg-surface-tertiary text-content-tertiary"
            }`}
          >
            {counter.isActive ? (
              <CheckCircle2 size={12} />
            ) : (
              <XCircle size={12} />
            )}
            {counter.isActive ? tc("active") : tc("inactive")}
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

          {/* ─── Basic Info ─── */}
          <section className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-content-primary">
              <Monitor size={18} className="text-accent-primary" />
              {tc("basicInfo")}
            </h2>

            {/* Branch (read-only display) */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {tc("selectBranch")}
              </label>
              <div className="input-field flex items-center gap-2 bg-surface-secondary/60">
                <Building2 size={14} className="text-content-tertiary" />
                <span className="text-sm text-content-primary">
                  {getBranchName(form.branchId)}
                </span>
              </div>
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

            {/* Current Assignment Info */}
            {currentAssignedEmployee && (
              <div className="mb-4 rounded-xl bg-accent-primary/5 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-content-tertiary">
                  <UserCheck size={12} />
                  {tc("currentlyAssigned")}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary text-sm font-bold text-white">
                    {currentAssignedEmployee.firstName?.[0]}
                    {currentAssignedEmployee.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-content-primary">
                      {currentAssignedEmployee.firstName}{" "}
                      {currentAssignedEmployee.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-content-tertiary">
                      <Phone size={10} />
                      {currentAssignedEmployee.phone}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="mb-3 text-xs text-content-tertiary">
              {tc("changeEmployeeDesc")}
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

          {/* ─── Status Toggle ─── */}
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-content-primary">
                  {counter.isActive
                    ? tc("deactivateCounter")
                    : tc("activateCounter")}
                </p>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  {counter.isActive ? tc("deactivateDesc") : tc("activateDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={toggling}
                className="transition-colors"
              >
                {toggling ? (
                  <Loader2
                    size={28}
                    className="animate-spin text-content-tertiary"
                  />
                ) : counter.isActive ? (
                  <ToggleRight size={32} className="text-status-success" />
                ) : (
                  <ToggleLeft size={32} className="text-content-tertiary" />
                )}
              </button>
            </div>
          </section>

          {/* ─── Actions ─── */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Link href="/dashboard/counters" className="btn-secondary">
              {tcom("cancel")}
            </Link>
            <button
              type="submit"
              disabled={saving || !form.employeeId}
              className="btn-primary"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? tcom("loading") : tcom("save")}
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
