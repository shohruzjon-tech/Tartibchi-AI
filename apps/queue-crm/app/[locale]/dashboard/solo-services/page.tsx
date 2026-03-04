"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  Check,
  X,
  GripVertical,
  ClipboardList,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../../../lib/api";
import { useAuthStore } from "../../../../lib/store";

export default function SoloServicesPage() {
  const t = useTranslations("soloServices");
  const tc = useTranslations("common");
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ─── Fetch tenant's solo profile services ─── */
  const fetchServices = useCallback(async () => {
    if (!token || !user?.tenantId) return;
    setLoading(true);
    try {
      const tenant = await api.tenants.get(user.tenantId, token);
      setServices(tenant?.soloProfile?.services || []);
    } catch {
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [token, user?.tenantId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  /* ─── Persist services to backend ─── */
  const persistServices = async (updated: string[]) => {
    if (!token || !user?.tenantId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.tenants.update(
        user.tenantId,
        { soloProfile: { services: updated } },
        token,
      );
      setServices(updated);
      setSuccessMsg(t("saved"));
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  /* ─── Add service ─── */
  const handleAdd = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    if (services.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setError(t("duplicate"));
      setTimeout(() => setError(null), 2500);
      return;
    }
    const updated = [...services, trimmed];
    setNewService("");
    persistServices(updated);
  };

  /* ─── Remove service ─── */
  const handleRemove = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    persistServices(updated);
  };

  /* ─── Start editing ─── */
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(services[index]);
  };

  /* ─── Save edit ─── */
  const saveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    if (
      services.some(
        (s, i) =>
          i !== editingIndex && s.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setError(t("duplicate"));
      setTimeout(() => setError(null), 2500);
      return;
    }
    const updated = [...services];
    updated[editingIndex] = trimmed;
    setEditingIndex(null);
    setEditingValue("");
    persistServices(updated);
  };

  /* ─── Cancel edit ─── */
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-content-tertiary">{t("subtitle")}</p>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-accent-primary">
            {services.length}
          </p>
          <p className="text-xs text-content-tertiary">{t("totalServices")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-status-success">
            {services.length}
          </p>
          <p className="text-xs text-content-tertiary">{t("active")}</p>
        </div>
        {saving && (
          <div className="card flex items-center justify-center gap-2 p-4">
            <Loader2 size={14} className="animate-spin text-accent-primary" />
            <span className="text-xs text-content-tertiary">{tc("saving")}…</span>
          </div>
        )}
      </div>

      {/* Add service input */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Sparkles
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary"
          />
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={t("addPlaceholder")}
            className="input-field w-full pl-10"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newService.trim() || saving}
          className="btn-primary flex items-center gap-2 px-5"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{tc("add")}</span>
        </button>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error"
          >
            <AlertTriangle size={15} />
            {error}
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-status-success/8 px-4 py-3 text-sm font-medium text-status-success"
          >
            <Check size={15} />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service list */}
      {services.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col items-center py-16 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-secondary">
            <ClipboardList size={28} className="text-content-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-content-primary">
            {t("emptyTitle")}
          </h3>
          <p className="mt-1 max-w-xs text-sm text-content-tertiary">
            {t("emptyDesc")}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {services.map((service, index) => (
            <motion.div
              key={`${service}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.03 }}
              className="card group flex items-center gap-3 p-4"
            >
              {/* Drag handle placeholder */}
              <GripVertical
                size={16}
                className="shrink-0 text-content-tertiary/40"
              />

              {/* Service number */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/8 text-xs font-bold text-accent-primary">
                {index + 1}
              </div>

              {/* Name or edit input */}
              {editingIndex === index ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                    className="input-field flex-1 py-1.5 text-sm"
                  />
                  <button
                    onClick={saveEdit}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-success/10 text-status-success transition-colors hover:bg-status-success/20"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary text-content-tertiary transition-colors hover:bg-surface-tertiary"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-content-primary">
                    {service}
                  </span>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => startEdit(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-accent-primary"
                      title={tc("edit")}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleRemove(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-status-error/10 hover:text-status-error"
                      title={tc("delete")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Help text */}
      <p className="mt-6 text-center text-xs text-content-tertiary/60">
        {t("helpText")}
      </p>
    </div>
  );
}
