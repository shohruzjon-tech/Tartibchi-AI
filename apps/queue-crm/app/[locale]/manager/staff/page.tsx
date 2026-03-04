"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Shield,
  MoreVertical,
  UserPlus,
  X,
  Check,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../../../../lib/store";
import { api } from "../../../../lib/api";

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function ManagerStaffPage() {
  const t = useTranslations("manager");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "+998",
    email: "",
    role: "STAFF",
  });

  const fetchEmployees = async () => {
    if (!token || !user?.tenantId || !user?.branchId) return;
    try {
      const data = await api.employees.list(
        { tenantId: user.tenantId, branchId: user.branchId },
        token,
      );
      const list = Array.isArray(data) ? data : (data as any)?.data || [];
      setEmployees(list);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token, user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.phone?.includes(q),
    );
  }, [employees, search]);

  const handleCreate = async () => {
    if (!token || !user) return;
    setCreating(true);
    setError("");
    try {
      await api.employees.create(
        {
          ...form,
          tenantId: user.tenantId,
          branchId: user.branchId,
        },
        token,
      );
      setShowCreate(false);
      setForm({
        firstName: "",
        lastName: "",
        phone: "+998",
        email: "",
        role: "STAFF",
      });
      await fetchEmployees();
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    if (!token) return;
    try {
      await api.employees.update(emp._id, { isActive: !emp.isActive }, token);
      await fetchEmployees();
    } catch {}
  };

  const roleColors: Record<string, string> = {
    STAFF: "bg-emerald-500/10 text-emerald-600",
    BRANCH_MANAGER: "bg-blue-500/10 text-blue-600",
    TENANT_ADMIN: "bg-amber-500/10 text-amber-600",
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
            {t("staffTitle")}
          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            {t("staffSubtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary gap-2"
        >
          <UserPlus size={16} />
          {t("addStaff")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-content-primary">
            {employees.length}
          </p>
          <p className="text-xs text-content-tertiary">{t("totalStaff")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-status-success">
            {employees.filter((e) => e.isActive).length}
          </p>
          <p className="text-xs text-content-tertiary">{t("active")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-content-tertiary">
            {employees.filter((e) => !e.isActive).length}
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
          placeholder={t("searchStaff")}
          className="input-field w-full pl-11"
        />
      </div>

      {/* Staff List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="mb-3 text-content-tertiary" />
            <p className="text-lg font-semibold text-content-primary">
              {t("noStaff")}
            </p>
            <p className="mt-1 text-sm text-content-tertiary">
              {t("noStaffDesc")}
            </p>
          </div>
        ) : (
          filtered.map((emp, i) => (
            <motion.div
              key={emp._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card flex items-center gap-4 p-4"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
                <span className="text-sm font-bold text-accent-primary">
                  {emp.firstName[0]}
                  {emp.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-content-primary truncate">
                  {emp.firstName} {emp.lastName}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {emp.phone && (
                    <span className="flex items-center gap-1 text-xs text-content-tertiary">
                      <Phone size={11} />
                      {emp.phone}
                    </span>
                  )}
                  {emp.email && (
                    <span className="flex items-center gap-1 text-xs text-content-tertiary">
                      <Mail size={11} />
                      {emp.email}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${roleColors[emp.role] || "bg-surface-secondary text-content-secondary"}`}
              >
                {emp.role === "STAFF"
                  ? t("roleStaff")
                  : emp.role === "BRANCH_MANAGER"
                    ? t("roleManager")
                    : t("roleAdmin")}
              </span>
              <button
                onClick={() => handleToggleActive(emp)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  emp.isActive
                    ? "bg-status-success/10 text-status-success hover:bg-status-success/20"
                    : "bg-surface-secondary text-content-tertiary hover:bg-surface-tertiary"
                }`}
              >
                {emp.isActive ? t("active") : t("inactive")}
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
                  {t("addStaff")}
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
                      {t("firstName")}
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                      {t("lastName")}
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                    {t("phone")}
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                    {t("role")}
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value }))
                    }
                    className="input-field"
                  >
                    <option value="STAFF">{t("roleStaff")}</option>
                    <option value="BRANCH_MANAGER">{t("roleManager")}</option>
                  </select>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={
                    creating || !form.firstName || !form.lastName || !form.phone
                  }
                  className="btn-primary w-full py-3"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {creating ? tc("loading") : t("addStaff")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
