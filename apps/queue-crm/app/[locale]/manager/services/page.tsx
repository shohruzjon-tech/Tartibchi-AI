"use client";

import { useState, useEffect, useMemo } from "react";
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
}

export default function ManagerServicesPage() {
  const t = useTranslations("manager");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    prefix: "",
    strategy: "FIFO",
  });

  const fetchServices = async () => {
    if (!user?.tenantId || !user?.branchId) return;
    try {
      const data = await api.queues.list({
        tenantId: user.tenantId,
        branchId: user.branchId,
      });
      const list = Array.isArray(data) ? data : (data as any)?.data || [];
      setServices(list);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.prefix.toLowerCase().includes(q),
    );
  }, [services, search]);

  const handleCreate = async () => {
    if (!token || !user) return;
    setCreating(true);
    setError("");
    try {
      await api.queues.create(
        {
          ...form,
          tenantId: user.tenantId,
          branchId: user.branchId,
        },
        token,
      );
      setShowCreate(false);
      setForm({ name: "", prefix: "", strategy: "FIFO" });
      await fetchServices();
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (svc: Service) => {
    if (!token) return;
    try {
      await api.queues.update(svc._id, { isActive: !svc.isActive }, token);
      await fetchServices();
    } catch {}
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
            {t("servicesTitle")}
          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            {t("servicesSubtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary gap-2"
        >
          <Plus size={16} />
          {t("addService")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-content-primary">
            {services.length}
          </p>
          <p className="text-xs text-content-tertiary">{t("totalServices")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-status-success">
            {services.filter((s) => s.isActive).length}
          </p>
          <p className="text-xs text-content-tertiary">{t("active")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-content-tertiary">
            {services.filter((s) => !s.isActive).length}
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
          placeholder={t("searchServices")}
          className="input-field w-full pl-11"
        />
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList size={40} className="mb-3 text-content-tertiary" />
            <p className="text-lg font-semibold text-content-primary">
              {t("noServices")}
            </p>
            <p className="mt-1 text-sm text-content-tertiary">
              {t("noServicesDesc")}
            </p>
          </div>
        ) : (
          filtered.map((svc, i) => (
            <motion.div
              key={svc._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card flex items-center gap-4 p-4"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                <ClipboardList size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-content-primary">{svc.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="rounded bg-surface-secondary px-2 py-0.5 text-xs font-mono text-content-secondary">
                    {svc.prefix}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-content-tertiary">
                    {svc.strategy === "FIFO" ? (
                      <Zap size={11} />
                    ) : (
                      <Crown size={11} />
                    )}
                    {svc.strategy}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleToggle(svc)}
                className="text-content-tertiary hover:text-content-primary transition-colors"
              >
                {svc.isActive ? (
                  <ToggleRight size={28} className="text-status-success" />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
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
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-elevated p-6 shadow-large"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-content-primary">
                  {t("addService")}
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                    {t("serviceName")}
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="input-field"
                    placeholder={t("serviceNamePlaceholder")}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                    {t("servicePrefix")}
                  </label>
                  <input
                    type="text"
                    value={form.prefix}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        prefix: e.target.value.toUpperCase().slice(0, 3),
                      }))
                    }
                    className="input-field font-mono uppercase"
                    placeholder="GS"
                    maxLength={3}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                    {t("strategy")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, strategy: "FIFO" }))
                      }
                      className={`card flex flex-col items-center gap-2 p-3 transition-all ${
                        form.strategy === "FIFO"
                          ? "ring-2 ring-accent-primary"
                          : ""
                      }`}
                    >
                      <Zap size={18} className="text-accent-primary" />
                      <span className="text-xs font-medium">{t("fifo")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, strategy: "PRIORITY" }))
                      }
                      className={`card flex flex-col items-center gap-2 p-3 transition-all ${
                        form.strategy === "PRIORITY"
                          ? "ring-2 ring-accent-primary"
                          : ""
                      }`}
                    >
                      <Crown size={18} className="text-amber-500" />
                      <span className="text-xs font-medium">
                        {t("priority")}
                      </span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating || !form.name || !form.prefix}
                  className="btn-primary w-full py-3"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {creating ? tc("loading") : t("addService")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
