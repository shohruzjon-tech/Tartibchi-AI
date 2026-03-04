"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Plus,
  Search,
  X,
  Check,
  Loader2,
  MapPin,
  Users,
  ToggleLeft,
  ToggleRight,
  Hash,
} from "lucide-react";
import { useAuthStore } from "../../../../lib/store";
import { api } from "../../../../lib/api";

interface Counter {
  _id: string;
  name: string;
  counterNumber?: number;
  description?: string;
  location?: string;
  floor?: string;
  queueIds: string[];
  isActive: boolean;
  staffId?: string;
  employeeId?: string;
  createdAt: string;
}

interface Service {
  _id: string;
  name: string;
  prefix: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export default function ManagerCountersPage() {
  const t = useTranslations("manager");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    counterNumber: 1,
    location: "",
    employeeId: "",
    queueIds: [] as string[],
  });

  const fetchData = async () => {
    if (!token || !user?.tenantId || !user?.branchId) return;
    try {
      const [ctrs, svcs, emps] = await Promise.all([
        api.counters
          .list({ tenantId: user.tenantId, branchId: user.branchId }, token)
          .catch(() => []),
        api.queues
          .list({ tenantId: user.tenantId, branchId: user.branchId })
          .catch(() => []),
        api.employees
          .list({ tenantId: user.tenantId, branchId: user.branchId }, token)
          .catch(() => []),
      ]);
      const ctrList = Array.isArray(ctrs) ? ctrs : (ctrs as any)?.data || [];
      const svcList = Array.isArray(svcs) ? svcs : (svcs as any)?.data || [];
      const empList = Array.isArray(emps) ? emps : (emps as any)?.data || [];
      setCounters(ctrList);
      setServices(svcList);
      setEmployees(empList);
    } catch {
      setCounters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return counters;
    const q = search.toLowerCase();
    return counters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q),
    );
  }, [counters, search]);

  const handleCreate = async () => {
    if (!token || !user) return;
    setCreating(true);
    setError("");
    try {
      await api.counters.create(
        {
          ...form,
          tenantId: user.tenantId,
          branchId: user.branchId,
        },
        token,
      );
      setShowCreate(false);
      setForm({
        name: "",
        counterNumber: counters.length + 1,
        location: "",
        employeeId: "",
        queueIds: [],
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (ctr: Counter) => {
    if (!token) return;
    try {
      await api.counters.update(ctr._id, { isActive: !ctr.isActive }, token);
      await fetchData();
    } catch {}
  };

  const toggleQueue = (queueId: string) => {
    setForm((f) => ({
      ...f,
      queueIds: f.queueIds.includes(queueId)
        ? f.queueIds.filter((id) => id !== queueId)
        : [...f.queueIds, queueId],
    }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {t("countersTitle")}
          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            {t("countersSubtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary gap-2"
        >
          <Plus size={16} />
          {t("addCounter")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-content-primary">
            {counters.length}
          </p>
          <p className="text-xs text-content-tertiary">{t("totalCounters")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-status-success">
            {counters.filter((c) => c.isActive).length}
          </p>
          <p className="text-xs text-content-tertiary">{t("active")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-content-tertiary">
            {counters.filter((c) => !c.isActive).length}
          </p>
          <p className="text-xs text-content-tertiary">{t("inactive")}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-content-tertiary"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchCounters")}
          className="input-field w-full pl-11"
        />
      </div>

      {/* Counters Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="card col-span-2 flex flex-col items-center justify-center py-16 text-center">
            <Monitor size={40} className="mb-3 text-content-tertiary" />
            <p className="text-lg font-semibold text-content-primary">
              {t("noCounters")}
            </p>
            <p className="mt-1 text-sm text-content-tertiary">
              {t("noCountersDesc")}
            </p>
          </div>
        ) : (
          filtered.map((ctr, i) => (
            <motion.div
              key={ctr._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                    <Monitor size={18} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-content-primary">
                      {ctr.name}
                    </p>
                    <span className="text-xs text-content-tertiary">
                      <Hash size={10} className="inline" />
                      {ctr.counterNumber}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(ctr)}
                  className="text-content-tertiary hover:text-content-primary transition-colors"
                >
                  {ctr.isActive ? (
                    <ToggleRight size={28} className="text-status-success" />
                  ) : (
                    <ToggleLeft size={28} />
                  )}
                </button>
              </div>
              {ctr.location && (
                <div className="flex items-center gap-1.5 text-xs text-content-tertiary mb-2">
                  <MapPin size={11} />
                  {ctr.location}
                  {ctr.floor && ` · ${ctr.floor}`}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {ctr.queueIds.map((qId) => {
                  const svc = services.find((s) => s._id === qId);
                  return svc ? (
                    <span
                      key={qId}
                      className="rounded-lg bg-accent-primary/8 px-2 py-0.5 text-xs font-medium text-accent-primary"
                    >
                      {svc.name}
                    </span>
                  ) : null;
                })}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-elevated p-6 shadow-large max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-content-primary">
                  {t("addCounter")}
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                      {t("counterName")}
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="input-field"
                      placeholder={t("counterNamePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                      {t("counterNumber")}
                    </label>
                    <input
                      type="number"
                      value={form.counterNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          counterNumber: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="input-field"
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                    {t("location")}
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                    className="input-field"
                    placeholder={t("locationPlaceholder")}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                    {t("assignEmployee")}
                  </label>
                  <select
                    value={form.employeeId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, employeeId: e.target.value }))
                    }
                    className="input-field"
                    required
                  >
                    <option value="">{t("selectEmployee")}</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                        {emp.phone ? ` (${emp.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {services.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                      {t("assignServices")}
                    </label>
                    <div className="space-y-2 rounded-xl bg-surface-secondary/40 p-3 max-h-40 overflow-y-auto">
                      {services.map((svc) => (
                        <label
                          key={svc._id}
                          className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-secondary"
                        >
                          <input
                            type="checkbox"
                            checked={form.queueIds.includes(svc._id)}
                            onChange={() => toggleQueue(svc._id)}
                            className="rounded border-surface-tertiary text-accent-primary focus:ring-accent-primary/20"
                          />
                          <span className="text-sm text-content-primary">
                            {svc.name}
                          </span>
                          <span className="ml-auto text-xs font-mono text-content-tertiary">
                            {svc.prefix}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleCreate}
                  disabled={creating || !form.name || !form.employeeId}
                  className="btn-primary w-full py-3"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {creating ? tc("loading") : t("addCounter")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
