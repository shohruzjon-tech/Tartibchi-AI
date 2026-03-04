"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Plus,
  Search,
  X,
  Check,
  Loader2,
  Zap,
  Crown,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Pencil,
  ChevronRight,
  Hash,
  Layers,
  Activity,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "../../../../lib/store";
import { api } from "../../../../lib/api";

interface Service {
  _id: string;
  name: string;
  prefix: string;
  strategy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function ManagerServicesPage() {
  const t = useTranslations("manager");
  const ts = useTranslations("services");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", prefix: "", strategy: "FIFO" });

  const [form, setForm] = useState({ name: "", prefix: "", strategy: "FIFO" });

  const fetchServices = useCallback(async () => {
    if (!user?.tenantId || !user?.branchId) return;
    try {
      const data = await api.queues.list({ tenantId: user.tenantId, branchId: user.branchId });
      const list = Array.isArray(data) ? data : (data as any)?.data || [];
      setServices(list);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, user?.branchId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q) || s.prefix.toLowerCase().includes(q));
  }, [services, search]);

  const activeServices = filtered.filter((s) => s.isActive);
  const inactiveServices = filtered.filter((s) => !s.isActive);

  const stats = useMemo(
    () => ({
      total: services.length,
      active: services.filter((s) => s.isActive).length,
      inactive: services.filter((s) => !s.isActive).length,
    }),
    [services],
  );

  const strategyConfig: Record<string, { color: string; icon: typeof Zap; label: string }> = {
    FIFO: { color: "text-status-info", icon: Layers, label: t("fifo") },
    PRIORITY: { color: "text-accent-primary", icon: Zap, label: t("priority") },
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch { return dateStr; }
  };

  const handleCreate = async () => {
    if (!token || !user) return;
    setCreating(true);
    setError("");
    try {
      await api.queues.create({ ...form, tenantId: user.tenantId, branchId: user.branchId }, token);
      setShowCreate(false);
      setForm({ name: "", prefix: "", strategy: "FIFO" });
      await fetchServices();
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!token || !selectedService) return;
    setToggling(true);
    try {
      const updated = await api.queues.update(selectedService._id, { isActive: !selectedService.isActive }, token);
      setServices((prev) => prev.map((s) => (s._id === selectedService._id ? updated : s)));
      setSelectedService(updated);
    } catch {} finally { setToggling(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedService) return;
    setError("");
    setSaving(true);
    try {
      const updated = await api.queues.update(selectedService._id, { name: editForm.name, prefix: editForm.prefix, strategy: editForm.strategy }, token);
      setServices((prev) => prev.map((s) => (s._id === selectedService._id ? updated : s)));
      setSelectedService(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!token || !selectedService) return;
    setSaving(true);
    try {
      await api.queues.delete(selectedService._id, token);
      setServices((prev) => prev.filter((s) => s._id !== selectedService._id));
      setSelectedService(null);
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally { setSaving(false); }
  };

  const openEdit = () => {
    if (!selectedService) return;
    setEditForm({ name: selectedService.name, prefix: selectedService.prefix, strategy: selectedService.strategy });
    setIsEditing(true);
    setError("");
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
          <h1 className="text-2xl font-bold text-content-primary">{t("servicesTitle")}</h1>
          <p className="mt-1 text-sm text-content-secondary">{t("servicesSubtitle")}</p>
        </div>
        <button onClick={() => { setShowCreate(true); setError(""); }} className="btn-primary gap-2">
          <Plus size={16} />
          {t("addService")}
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { label: ts("totalServices"), value: stats.total, color: "text-content-primary", iconBg: "bg-surface-tertiary", icon: <ClipboardList size={14} className="text-content-secondary" /> },
          { label: ts("activeServices"), value: stats.active, color: "text-status-success", iconBg: "bg-status-success/10", icon: <CheckCircle2 size={14} className="text-status-success" /> },
          { label: ts("inactiveServices"), value: stats.inactive, color: "text-content-tertiary", iconBg: "bg-surface-tertiary", icon: <XCircle size={14} className="text-content-tertiary" /> },
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
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchServices")} className="input-field h-10 w-full pl-10 text-sm" />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-content-tertiary transition-colors hover:text-content-primary"><X size={14} /></button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-content-tertiary">
          {ts("showingResults", { count: filtered.length, total: services.length })}
        </p>
      </div>

      {/* Active */}
      {activeServices.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">{ts("activeServices")} ({activeServices.length})</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeServices.map((svc, i) => (
              <ServiceCard key={svc._id} service={svc} index={i} onClick={() => { setSelectedService(svc); setIsEditing(false); setError(""); }} strategyConfig={strategyConfig} ts={ts} />
            ))}
          </div>
        </section>
      )}

      {/* Inactive */}
      {inactiveServices.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-content-tertiary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">{ts("inactiveServices")} ({inactiveServices.length})</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inactiveServices.map((svc, i) => (
              <ServiceCard key={svc._id} service={svc} index={i} onClick={() => { setSelectedService(svc); setIsEditing(false); setError(""); }} strategyConfig={strategyConfig} ts={ts} />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="py-24 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-secondary">
            <ClipboardList size={32} className="text-content-tertiary" />
          </div>
          <p className="text-base font-semibold text-content-secondary">{search ? tc("noResults") : t("noServices")}</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-content-tertiary">{search ? ts("tryDifferentSearch") : t("noServicesDesc")}</p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-5 inline-flex"><Plus size={16} />{t("addService")}</button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-elevated p-6 shadow-large">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-content-primary">{t("addService")}</h2>
                <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary"><X size={18} /></button>
              </div>
              {error && !selectedService && (
                <div className="mb-4 rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error">{error}</div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("serviceName")}</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" placeholder={t("serviceNamePlaceholder")} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("servicePrefix")}</label>
                  <input type="text" value={form.prefix} onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value.toUpperCase().slice(0, 3) }))} className="input-field font-mono uppercase" placeholder="GS" maxLength={3} required />
                  <p className="mt-1 text-xs text-content-tertiary">{ts("prefixHint")}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("strategy")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setForm((f) => ({ ...f, strategy: "FIFO" }))} className={`card flex flex-col items-center gap-2 p-3 transition-all ${form.strategy === "FIFO" ? "ring-2 ring-accent-primary" : ""}`}>
                      <Zap size={18} className="text-accent-primary" />
                      <span className="text-xs font-medium">{t("fifo")}</span>
                    </button>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, strategy: "PRIORITY" }))} className={`card flex flex-col items-center gap-2 p-3 transition-all ${form.strategy === "PRIORITY" ? "ring-2 ring-accent-primary" : ""}`}>
                      <Crown size={18} className="text-amber-500" />
                      <span className="text-xs font-medium">{t("priority")}</span>
                    </button>
                  </div>
                </div>
                <button onClick={handleCreate} disabled={creating || !form.name || !form.prefix} className="btn-primary w-full py-3">
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {creating ? tc("loading") : t("addService")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail / Edit Drawer */}
      <AnimatePresence>
        {selectedService && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedService(null); setIsEditing(false); setError(""); }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-surface-elevated p-6 shadow-large">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-content-primary">{isEditing ? ts("editService") : ts("serviceDetails")}</h2>
                <button onClick={() => { setSelectedService(null); setIsEditing(false); setError(""); }} className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary"><X size={18} /></button>
              </div>
              {selectedService && !isEditing && (
                <DrawerViewContent service={selectedService} ts={ts} tc={tc} t={t} strategyConfig={strategyConfig} formatDate={formatDate} onEdit={openEdit} onToggleActive={handleToggleActive} toggling={toggling} />
              )}
              {selectedService && isEditing && (
                <DrawerEditContent editForm={editForm} setEditForm={setEditForm} ts={ts} tc={tc} t={t} error={error} saving={saving} onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} onDelete={handleDelete} />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══ Service Card ═══ */
function ServiceCard({ service, index, onClick, strategyConfig, ts }: { service: Service; index: number; onClick: () => void; strategyConfig: Record<string, { color: string; icon: typeof Zap; label: string }>; ts: any }) {
  const strat = strategyConfig[service.strategy] || strategyConfig.FIFO;
  const StratIcon = strat.icon;

  return (
    <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035, duration: 0.35, ease: "easeOut" }} onClick={onClick}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-surface-elevated text-left shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-0.5 ${!service.isActive ? "opacity-55" : ""}`}>
      <div className={`h-1 w-full bg-gradient-to-r ${service.isActive ? "from-emerald-500 to-teal-500" : "from-content-tertiary/30 to-content-tertiary/10"} opacity-70 transition-opacity group-hover:opacity-100`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-shadow ${service.isActive ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 shadow-sm" : "bg-surface-tertiary"}`}>
            <ClipboardList size={20} className={service.isActive ? "text-emerald-600" : "text-content-tertiary"} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold leading-snug text-content-primary">{service.name}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-content-tertiary">
              <Hash size={11} className="shrink-0" />
              <span className="font-mono">{service.prefix}</span>
            </p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-content-tertiary/50 transition-all group-hover:translate-x-0.5 group-hover:text-content-tertiary" />
        </div>
        <div className="my-3.5 h-px bg-surface-secondary" />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-lg bg-surface-secondary/80 px-2 py-1 text-[11px] font-semibold ${strat.color}`}>
            <StratIcon size={10} />{strat.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
            <span className={`h-1.5 w-1.5 rounded-full ${service.isActive ? "bg-status-success" : "bg-content-tertiary"}`} />
            <span className={service.isActive ? "text-status-success" : "text-content-tertiary"}>{service.isActive ? ts("active") : ts("inactive")}</span>
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ═══ Drawer View ═══ */
function DrawerViewContent({ service, ts, tc, t, strategyConfig, formatDate, onEdit, onToggleActive, toggling }: { service: Service; ts: any; tc: any; t: any; strategyConfig: Record<string, { color: string; icon: typeof Zap; label: string }>; formatDate: (d: string) => string; onEdit: () => void; onToggleActive: () => void; toggling: boolean }) {
  const strat = strategyConfig[service.strategy] || strategyConfig.FIFO;
  const StratIcon = strat.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${service.isActive ? "bg-status-success/10 text-status-success" : "bg-surface-tertiary text-content-tertiary"}`}>
          {service.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {service.isActive ? ts("active") : ts("inactive")}
        </div>
        <button onClick={onEdit} className="btn-ghost flex items-center gap-1.5 text-sm"><Pencil size={14} />{tc("edit")}</button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 shadow-sm">
          <ClipboardList size={24} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">{service.name}</h3>
          <p className="text-xs text-content-tertiary">{ts("createdOn")} {formatDate(service.createdAt)}</p>
        </div>
      </div>
      <div className="space-y-0.5 overflow-hidden rounded-xl bg-surface-secondary/60">
        <DetailRow icon={<Hash size={15} />} label={ts("prefix")} value={service.prefix} />
        <DetailRow icon={<StratIcon size={15} />} label={ts("strategy")} value={strat.label} />
      </div>
      <div className="rounded-xl bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10"><Activity size={16} className="text-accent-primary" /></div>
          <div>
            <p className="text-sm font-semibold text-content-primary">{service.strategy === "FIFO" ? ts("fifoTitle") : ts("priorityTitle")}</p>
            <p className="mt-0.5 text-xs text-content-secondary">{service.strategy === "FIFO" ? ts("fifoDesc") : ts("priorityDesc")}</p>
          </div>
        </div>
      </div>
      {service.updatedAt && (
        <div className="rounded-xl bg-surface-secondary/60 p-4">
          <div className="flex justify-between text-xs">
            <span className="text-content-tertiary">{ts("lastUpdated")}</span>
            <span className="font-medium text-content-secondary">{formatDate(service.updatedAt)}</span>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-surface-tertiary p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-content-primary">{service.isActive ? ts("deactivateService") : ts("activateService")}</p>
            <p className="mt-0.5 text-xs text-content-tertiary">{service.isActive ? ts("deactivateDesc") : ts("activateDesc")}</p>
          </div>
          <button onClick={onToggleActive} disabled={toggling} className="transition-colors">
            {toggling ? <Loader2 size={28} className="animate-spin text-content-tertiary" /> : service.isActive ? <ToggleRight size={32} className="text-status-success" /> : <ToggleLeft size={32} className="text-content-tertiary" />}
          </button>
        </div>
      </div>
      <button onClick={onEdit} className="btn-primary w-full justify-center"><Pencil size={16} />{ts("editService")}</button>
    </div>
  );
}

/* ═══ Drawer Edit ═══ */
function DrawerEditContent({ editForm, setEditForm, ts, tc, t, error, saving, onSubmit, onCancel, onDelete }: { editForm: { name: string; prefix: string; strategy: string }; setEditForm: (f: any) => void; ts: any; tc: any; t: any; error: string; saving: boolean; onSubmit: (e: React.FormEvent) => void; onCancel: () => void; onDelete: () => void }) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error">{error}</motion.div>}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("serviceName")}</label>
        <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="input-field" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("servicePrefix")}</label>
        <input type="text" value={editForm.prefix} onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value.toUpperCase() })} required maxLength={3} className="input-field font-mono uppercase" />
        <p className="mt-1 text-xs text-content-tertiary">{ts("prefixHint")}</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("strategy")}</label>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setEditForm({ ...editForm, strategy: "FIFO" })} className={`card flex flex-col items-center gap-2 p-3 transition-all ${editForm.strategy === "FIFO" ? "ring-2 ring-accent-primary" : ""}`}>
            <Zap size={18} className="text-accent-primary" />
            <span className="text-xs font-medium">{t("fifo")}</span>
          </button>
          <button type="button" onClick={() => setEditForm({ ...editForm, strategy: "PRIORITY" })} className={`card flex flex-col items-center gap-2 p-3 transition-all ${editForm.strategy === "PRIORITY" ? "ring-2 ring-accent-primary" : ""}`}>
            <Crown size={18} className="text-amber-500" />
            <span className="text-xs font-medium">{t("priority")}</span>
          </button>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">{tc("cancel")}</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {tc("save")}
        </button>
      </div>
      <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4">
        <p className="mb-1 text-sm font-semibold text-status-error">{ts("dangerZone")}</p>
        <p className="mb-3 text-xs text-content-tertiary">{ts("deleteDesc")}</p>
        <button type="button" onClick={onDelete} disabled={saving} className="rounded-xl bg-status-error/10 px-4 py-2 text-sm font-semibold text-status-error transition-all hover:bg-status-error/20">
          <span className="flex items-center gap-1.5"><Trash2 size={14} />{tc("delete")}</span>
        </button>
      </div>
    </form>
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
