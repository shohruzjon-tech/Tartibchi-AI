"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  CheckCircle2,
  XCircle,
  Pencil,
  ChevronRight,
  Layers,
  Clock,
  Tag,
  UserCheck,
  Phone,
  Key,
  ListChecks,
  ExternalLink,
  Globe,
} from "lucide-react";
import { Link } from "../../../../i18n/navigation";
import { useAuthStore } from "../../../../lib/store";
import { api } from "../../../../lib/api";

interface Counter {
  _id: string;
  name: string;
  counterNumber?: number;
  description?: string;
  location?: string;
  floor?: string;
  serviceTypes?: string[];
  languages?: string[];
  avgServiceTime?: number;
  maxConcurrentTickets?: number;
  priority?: number;
  tags?: string[];
  queueIds: string[];
  isActive: boolean;
  currentTicketId?: string;
  staffId?: string;
  employeeId?: { _id: string; firstName: string; lastName: string; phone?: string; email?: string } | string;
  login?: string;
  createdAt: string;
  updatedAt?: string;
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
  const tctr = useTranslations("counters");
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

  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [toggling, setToggling] = useState(false);

  const [form, setForm] = useState({
    name: "",
    counterNumber: 1,
    location: "",
    employeeId: "",
    queueIds: [] as string[],
  });

  const fetchData = useCallback(async () => {
    if (!token || !user?.tenantId || !user?.branchId) return;
    try {
      const [ctrs, svcs, emps] = await Promise.all([
        api.counters.list({ tenantId: user.tenantId, branchId: user.branchId }, token).catch(() => []),
        api.queues.list({ tenantId: user.tenantId, branchId: user.branchId }).catch(() => []),
        api.employees.list({ tenantId: user.tenantId, branchId: user.branchId }, token).catch(() => []),
      ]);
      setCounters(Array.isArray(ctrs) ? ctrs : (ctrs as any)?.data || []);
      setServices(Array.isArray(svcs) ? svcs : (svcs as any)?.data || []);
      setEmployees(Array.isArray(emps) ? emps : (emps as any)?.data || []);
    } catch {
      setCounters([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.tenantId, user?.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return counters;
    const q = search.toLowerCase();
    return counters.filter(
      (c) => c.name.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q) || (c.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [counters, search]);

  const activeCounters = filtered.filter((c) => c.isActive);
  const inactiveCounters = filtered.filter((c) => !c.isActive);

  const stats = useMemo(
    () => ({
      total: counters.length,
      active: counters.filter((c) => c.isActive).length,
      inactive: counters.filter((c) => !c.isActive).length,
    }),
    [counters],
  );

  const getQueueName = (queueId: string) => services.find((s) => s._id === queueId)?.name || queueId;

  const getEmployeeName = (emp: Counter["employeeId"]) => {
    if (!emp) return null;
    if (typeof emp === "string") {
      const found = employees.find((e) => e._id === emp);
      return found ? `${found.firstName} ${found.lastName}` : null;
    }
    return `${emp.firstName} ${emp.lastName}`;
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch { return dateStr; }
  };

  const handleCreate = async () => {
    if (!token || !user) return;
    setCreating(true);
    setError("");
    try {
      await api.counters.create({ ...form, tenantId: user.tenantId, branchId: user.branchId }, token);
      setShowCreate(false);
      setForm({ name: "", counterNumber: counters.length + 2, location: "", employeeId: "", queueIds: [] });
      await fetchData();
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!token || !selectedCounter) return;
    setToggling(true);
    try {
      const result = await api.counters.update(selectedCounter._id, { isActive: !selectedCounter.isActive }, token);
      const updated = (result as any).counter || result;
      setCounters((prev) => prev.map((c) => (c._id === selectedCounter._id ? updated : c)));
      setSelectedCounter(updated);
    } catch {} finally { setToggling(false); }
  };

  const toggleQueue = (queueId: string) => {
    setForm((f) => ({ ...f, queueIds: f.queueIds.includes(queueId) ? f.queueIds.filter((id) => id !== queueId) : [...f.queueIds, queueId] }));
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
          <h1 className="text-2xl font-bold text-content-primary">{t("countersTitle")}</h1>
          <p className="mt-1 text-sm text-content-secondary">{t("countersSubtitle")}</p>
        </div>
        <button onClick={() => { setShowCreate(true); setError(""); }} className="btn-primary gap-2">
          <Plus size={16} />
          {t("addCounter")}
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { label: tctr("totalCounters"), value: stats.total, color: "text-content-primary", iconBg: "bg-surface-tertiary", icon: <Monitor size={14} className="text-content-secondary" /> },
          { label: tctr("activeCounters"), value: stats.active, color: "text-status-success", iconBg: "bg-status-success/10", icon: <CheckCircle2 size={14} className="text-status-success" /> },
          { label: tctr("inactiveCounters"), value: stats.inactive, color: "text-content-tertiary", iconBg: "bg-surface-tertiary", icon: <XCircle size={14} className="text-content-tertiary" /> },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-2xl bg-surface-elevated px-4 py-3.5 shadow-soft">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>{stat.icon}</div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-content-tertiary sm:text-[11px]">{stat.label}</p>
              <p className={`text-xl font-bold leading-tight ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative sm:max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchCounters")} className="input-field h-10 w-full pl-10 text-sm" />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-content-tertiary transition-colors hover:text-content-primary"><X size={14} /></button>
        )}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-content-tertiary">
          {tctr("showingResults", { count: filtered.length, total: counters.length })}
        </p>
      </div>

      {/* Active */}
      {activeCounters.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">{tctr("activeCounters")} ({activeCounters.length})</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeCounters.map((ctr, i) => (
              <CounterCard key={ctr._id} counter={ctr} index={i} onClick={() => { setSelectedCounter(ctr); setError(""); }} getQueueName={getQueueName} getEmployeeName={getEmployeeName} tctr={tctr} />
            ))}
          </div>
        </section>
      )}

      {/* Inactive */}
      {inactiveCounters.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-content-tertiary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">{tctr("inactiveCounters")} ({inactiveCounters.length})</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inactiveCounters.map((ctr, i) => (
              <CounterCard key={ctr._id} counter={ctr} index={i} onClick={() => { setSelectedCounter(ctr); setError(""); }} getQueueName={getQueueName} getEmployeeName={getEmployeeName} tctr={tctr} />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="py-24 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-secondary">
            <Monitor size={32} className="text-content-tertiary" />
          </div>
          <p className="text-base font-semibold text-content-secondary">{search ? tc("noResults") : t("noCounters")}</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-content-tertiary">{search ? tctr("tryDifferentSearch") : t("noCountersDesc")}</p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-5 inline-flex"><Plus size={16} />{t("addCounter")}</button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-elevated p-6 shadow-large max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-content-primary">{t("addCounter")}</h2>
                <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary"><X size={18} /></button>
              </div>
              {error && !selectedCounter && (
                <div className="mb-4 rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error">{error}</div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("counterName")}</label>
                    <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" placeholder={t("counterNamePlaceholder")} required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("counterNumber")}</label>
                    <input type="number" value={form.counterNumber} onChange={(e) => setForm((f) => ({ ...f, counterNumber: parseInt(e.target.value) || 1 }))} className="input-field" min={1} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("location")}</label>
                  <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="input-field" placeholder={t("locationPlaceholder")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("assignEmployee")}</label>
                  <select value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} className="input-field" required>
                    <option value="">{t("selectEmployee")}</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}{emp.phone ? ` (${emp.phone})` : ""}</option>
                    ))}
                  </select>
                </div>
                {services.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("assignServices")}</label>
                    <div className="space-y-2 rounded-xl bg-surface-secondary/40 p-3 max-h-40 overflow-y-auto">
                      {services.map((svc) => (
                        <label key={svc._id} className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-secondary">
                          <input type="checkbox" checked={form.queueIds.includes(svc._id)} onChange={() => toggleQueue(svc._id)} className="rounded border-surface-tertiary text-accent-primary focus:ring-accent-primary/20" />
                          <span className="text-sm text-content-primary">{svc.name}</span>
                          <span className="ml-auto text-xs font-mono text-content-tertiary">{svc.prefix}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={handleCreate} disabled={creating || !form.name || !form.employeeId} className="btn-primary w-full py-3">
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {creating ? tc("loading") : t("addCounter")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedCounter && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedCounter(null); setError(""); }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-surface-elevated p-6 shadow-large">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-content-primary">{tctr("counterDetails")}</h2>
                <button onClick={() => { setSelectedCounter(null); setError(""); }} className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary"><X size={18} /></button>
              </div>
              <DrawerContent counter={selectedCounter} tctr={tctr} tc={tc} getQueueName={getQueueName} getEmployeeName={getEmployeeName} formatDate={formatDate} handleToggleActive={handleToggleActive} toggling={toggling} employees={employees} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══ Counter Card ═══ */
function CounterCard({ counter, index, onClick, getQueueName, getEmployeeName, tctr }: { counter: Counter; index: number; onClick: () => void; getQueueName: (id: string) => string; getEmployeeName: (emp: Counter["employeeId"]) => string | null; tctr: any }) {
  const locationText = (counter.location || "") + (counter.floor ? " · " + counter.floor : "");
  const empName = getEmployeeName(counter.employeeId);

  return (
    <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035, duration: 0.35, ease: "easeOut" }} onClick={onClick}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-surface-elevated text-left shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-0.5 ${!counter.isActive ? "opacity-55" : ""}`}>
      <div className={`h-1 w-full bg-gradient-to-r ${counter.isActive ? "from-violet-500 to-purple-500" : "from-content-tertiary/30 to-content-tertiary/10"} opacity-70 transition-opacity group-hover:opacity-100`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-shadow ${counter.isActive ? "bg-gradient-to-br from-violet-500/10 to-purple-500/10 shadow-sm" : "bg-surface-tertiary"}`}>
            <Monitor size={20} className={counter.isActive ? "text-violet-600" : "text-content-tertiary"} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold leading-snug text-content-primary">
              {counter.name}
              {counter.counterNumber ? <span className="ml-1.5 text-xs font-normal text-content-tertiary">#{counter.counterNumber}</span> : null}
            </h3>
            {empName && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-accent-primary"><UserCheck size={11} className="shrink-0" />{empName}</p>
            )}
          </div>
          <ChevronRight size={16} className="shrink-0 text-content-tertiary/50 transition-all group-hover:translate-x-0.5 group-hover:text-content-tertiary" />
        </div>
        <div className="my-3.5 h-px bg-surface-secondary" />
        <div className="flex flex-wrap items-center gap-1.5">
          {counter.location && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary/80 px-2 py-1 text-[11px] font-medium text-content-secondary"><MapPin size={10} />{locationText}</span>
          )}
          {counter.queueIds.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-accent-primary/8 px-2 py-1 text-[11px] font-medium text-accent-primary"><Hash size={10} />{counter.queueIds.length} {counter.queueIds.length !== 1 ? tctr("queues") : tctr("queue")}</span>
          )}
          {counter.languages && counter.languages.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary/80 px-2 py-1 text-[11px] font-medium text-content-secondary"><Globe size={10} />{counter.languages.join(", ")}</span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
            <span className={`h-1.5 w-1.5 rounded-full ${counter.isActive ? "bg-status-success" : "bg-content-tertiary"}`} />
            <span className={counter.isActive ? "text-status-success" : "text-content-tertiary"}>{counter.isActive ? tctr("active") : tctr("inactive")}</span>
          </span>
        </div>
        {counter.tags && counter.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {counter.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="rounded-md bg-accent-primary/6 px-2 py-0.5 text-[10px] font-medium text-accent-primary">{tag}</span>
            ))}
            {counter.tags.length > 3 && <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-content-tertiary">+{counter.tags.length - 3}</span>}
          </div>
        )}
      </div>
    </motion.button>
  );
}

/* ═══ Drawer Content ═══ */
function DrawerContent({ counter, tctr, tc, getQueueName, getEmployeeName, formatDate, handleToggleActive, toggling, employees }: { counter: Counter; tctr: any; tc: any; getQueueName: (id: string) => string; getEmployeeName: (emp: Counter["employeeId"]) => string | null; formatDate: (d: string) => string; handleToggleActive: () => void; toggling: boolean; employees: Employee[] }) {
  const counterTitle = counter.name + (counter.counterNumber ? " #" + counter.counterNumber : "");
  const locationValue = (counter.location || "") + (counter.floor ? " · " + counter.floor : "");
  const empName = getEmployeeName(counter.employeeId);
  const empObj = typeof counter.employeeId === "object" ? counter.employeeId : employees.find((e) => e._id === counter.employeeId);

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${counter.isActive ? "bg-status-success/10 text-status-success" : "bg-surface-tertiary text-content-tertiary"}`}>
          {counter.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {counter.isActive ? tctr("active") : tctr("inactive")}
        </div>
        <Link href={"/staff/counter/" + counter._id} target="_blank" className="btn-ghost flex items-center gap-1.5 text-sm"><ExternalLink size={14} />{tctr("openScreen")}</Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-purple-500/10 shadow-sm">
          <Monitor size={24} className="text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">{counterTitle}</h3>
          <p className="text-xs text-content-tertiary">{tctr("createdOn")} {formatDate(counter.createdAt)}</p>
        </div>
      </div>

      {/* Description */}
      {counter.description && (
        <div className="rounded-xl bg-surface-secondary/60 p-4"><p className="text-sm text-content-secondary">{counter.description}</p></div>
      )}

      {/* Details */}
      <div className="space-y-0.5 overflow-hidden rounded-xl bg-surface-secondary/60">
        {counter.location && <DetailRow icon={<MapPin size={15} />} label={tctr("location")} value={locationValue} />}
        {counter.serviceTypes && counter.serviceTypes.length > 0 && <DetailRow icon={<Layers size={15} />} label={tctr("serviceTypes")} value={counter.serviceTypes.join(", ")} />}
        {counter.languages && counter.languages.length > 0 && <DetailRow icon={<Globe size={15} />} label={tctr("languages")} value={counter.languages.join(", ")} />}
        {(counter.avgServiceTime ?? 0) > 0 && <DetailRow icon={<Clock size={15} />} label={tctr("avgServiceTime")} value={counter.avgServiceTime + " min"} />}
        <DetailRow icon={<ListChecks size={15} />} label={tctr("maxConcurrentTickets")} value={String(counter.maxConcurrentTickets ?? 1)} />
      </div>

      {/* Assigned Employee */}
      {empObj && (
        <div className="rounded-xl bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-content-tertiary"><UserCheck size={12} />{tctr("assignedEmployee")}</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary text-sm font-bold text-white">
              {(empObj as any).firstName?.[0]}{(empObj as any).lastName?.[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-content-primary">{empName}</p>
              {(empObj as any).phone && (
                <div className="flex items-center gap-1 text-xs text-content-tertiary"><Phone size={10} />{(empObj as any).phone}</div>
              )}
            </div>
          </div>
          {counter.login && (
            <div className="mt-2 flex items-center gap-2 text-xs text-content-secondary"><Key size={10} /><span className="font-medium">{tctr("loginLabel")}:</span><span className="rounded-md bg-surface-secondary px-1.5 py-0.5 font-mono">{counter.login}</span></div>
          )}
        </div>
      )}

      {/* Tags */}
      {counter.tags && counter.tags.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-content-tertiary">{tctr("tags")}</p>
          <div className="flex flex-wrap gap-1.5">
            {counter.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-accent-primary/8 px-2.5 py-1 text-xs font-medium text-accent-primary"><Tag size={10} />{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Queues */}
      {counter.queueIds.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-content-tertiary">{tctr("queuesAssigned")} ({counter.queueIds.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {counter.queueIds.map((qId) => (
              <span key={qId} className="rounded-lg bg-surface-secondary/80 px-2.5 py-1 text-xs font-medium text-content-secondary">{getQueueName(qId)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      {counter.updatedAt && (
        <div className="rounded-xl bg-surface-secondary/60 p-4">
          <div className="flex justify-between text-xs">
            <span className="text-content-tertiary">{tctr("lastUpdated")}</span>
            <span className="font-medium text-content-secondary">{formatDate(counter.updatedAt)}</span>
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="rounded-xl border border-surface-tertiary p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-content-primary">{counter.isActive ? tctr("deactivateCounter") : tctr("activateCounter")}</p>
            <p className="mt-0.5 text-xs text-content-tertiary">{counter.isActive ? tctr("deactivateDesc") : tctr("activateDesc")}</p>
          </div>
          <button onClick={handleToggleActive} disabled={toggling} className="transition-colors">
            {toggling ? <Loader2 size={28} className="animate-spin text-content-tertiary" /> : counter.isActive ? <ToggleRight size={32} className="text-status-success" /> : <ToggleLeft size={32} className="text-content-tertiary" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Detail Row ═══ */
function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-surface-secondary/40 px-4 py-3">
      <span className="text-content-tertiary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-content-tertiary">{label}</p>
        <p className="truncate text-sm font-medium text-content-primary">{value}</p>
      </div>
    </div>
  );
}
