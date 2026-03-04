"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Shield,
  UserPlus,
  X,
  Check,
  Loader2,
  ChevronRight,
  Pencil,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  UserCog,
  UserCheck,
  Send,
  FileText,
} from "lucide-react";
import { useAuthStore } from "../../../../lib/store";
import { api } from "../../../../lib/api";

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  telegramId?: string;
  role: string;
  branchId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const ROLES = ["STAFF", "BRANCH_MANAGER"] as const;

export default function ManagerStaffPage() {
  const t = useTranslations("manager");
  const te = useTranslations("employees");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "+998",
    role: "STAFF",
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "+998",
    email: "",
    role: "STAFF",
  });

  const fetchEmployees = useCallback(async () => {
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
  }, [token, user?.tenantId, user?.branchId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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

  const activeEmployees = filtered.filter((e) => e.isActive);
  const inactiveEmployees = filtered.filter((e) => !e.isActive);

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.isActive).length,
      managers: employees.filter((e) => e.role === "BRANCH_MANAGER").length,
      staff: employees.filter((e) => e.role === "STAFF").length,
    }),
    [employees],
  );

  const handleCreate = async () => {
    if (!token || !user) return;
    setCreating(true);
    setError("");
    try {
      await api.employees.create(
        { ...form, tenantId: user.tenantId, branchId: user.branchId },
        token,
      );
      setShowCreate(false);
      setForm({ firstName: "", lastName: "", phone: "+998", email: "", role: "STAFF" });
      await fetchEmployees();
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!token || !selectedEmployee) return;
    setToggling(true);
    try {
      const updated = await api.employees.update(selectedEmployee._id, { isActive: !selectedEmployee.isActive }, token);
      setEmployees((prev) => prev.map((e) => (e._id === selectedEmployee._id ? updated : e)));
      setSelectedEmployee(updated);
    } catch {} finally {
      setToggling(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedEmployee) return;
    setError("");
    setSaving(true);
    try {
      const updated = await api.employees.update(
        selectedEmployee._id,
        { firstName: editForm.firstName, lastName: editForm.lastName, phone: editForm.phone, role: editForm.role },
        token,
      );
      setEmployees((prev) => prev.map((e) => (e._id === selectedEmployee._id ? updated : e)));
      setSelectedEmployee(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    if (!selectedEmployee) return;
    setEditForm({
      firstName: selectedEmployee.firstName,
      lastName: selectedEmployee.lastName,
      phone: selectedEmployee.phone || "+998",
      role: selectedEmployee.role,
    });
    setIsEditing(true);
    setError("");
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "BRANCH_MANAGER":
        return { label: te("roleBranchManager"), color: "text-status-warning", bg: "bg-status-warning/8", icon: UserCog };
      case "TENANT_ADMIN":
        return { label: te("roleTenantAdmin"), color: "text-accent-primary", bg: "bg-accent-primary/8", icon: ShieldCheck };
      default:
        return { label: te("roleStaff"), color: "text-status-info", bg: "bg-status-info/8", icon: UserCheck };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch { return dateStr; }
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
          <h1 className="text-2xl font-bold text-content-primary">{t("staffTitle")}</h1>
          <p className="mt-1 text-sm text-content-secondary">{t("staffSubtitle")}</p>
        </div>
        <button onClick={() => { setShowCreate(true); setError(""); }} className="btn-primary gap-2">
          <UserPlus size={16} />
          {t("addStaff")}
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {[
          { label: te("totalEmployees"), value: stats.total, color: "text-content-primary", iconBg: "bg-surface-tertiary", icon: <Users size={14} className="text-content-secondary" /> },
          { label: te("activeEmployees"), value: stats.active, color: "text-status-success", iconBg: "bg-status-success/10", icon: <CheckCircle2 size={14} className="text-status-success" /> },
          { label: te("managers"), value: stats.managers, color: "text-status-warning", iconBg: "bg-status-warning/10", icon: <ShieldCheck size={14} className="text-status-warning" /> },
          { label: te("staffCount"), value: stats.staff, color: "text-status-info", iconBg: "bg-status-info/10", icon: <UserCheck size={14} className="text-status-info" /> },
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
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchStaff")} className="input-field h-10 w-full pl-10 text-sm" />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-content-tertiary transition-colors hover:text-content-primary">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-content-tertiary">
          {te("showingResults", { count: filtered.length, total: employees.length })}
        </p>
      </div>

      {/* Active */}
      {activeEmployees.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              {te("activeEmployees")} ({activeEmployees.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeEmployees.map((emp, i) => (
              <EmployeeCard key={emp._id} employee={emp} index={i} onClick={() => { setSelectedEmployee(emp); setIsEditing(false); setError(""); }} getRoleConfig={getRoleConfig} te={te} />
            ))}
          </div>
        </section>
      )}

      {/* Inactive */}
      {inactiveEmployees.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-content-tertiary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              {te("inactiveEmployees")} ({inactiveEmployees.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inactiveEmployees.map((emp, i) => (
              <EmployeeCard key={emp._id} employee={emp} index={i} onClick={() => { setSelectedEmployee(emp); setIsEditing(false); setError(""); }} getRoleConfig={getRoleConfig} te={te} />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="py-24 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-secondary">
            <Users size={32} className="text-content-tertiary" />
          </div>
          <p className="text-base font-semibold text-content-secondary">{search ? tc("noResults") : t("noStaff")}</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-content-tertiary">{search ? te("tryDifferentSearch") : t("noStaffDesc")}</p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-5 inline-flex"><UserPlus size={16} />{t("addStaff")}</button>
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
                <h2 className="text-lg font-bold text-content-primary">{t("addStaff")}</h2>
                <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary"><X size={18} /></button>
              </div>
              {error && !selectedEmployee && (
                <div className="mb-4 rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error">{error}</div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("firstName")}</label>
                    <input type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="input-field" placeholder={te("firstNamePlaceholder")} required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("lastName")}</label>
                    <input type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="input-field" placeholder={te("lastNamePlaceholder")} required />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("phone")}</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("emailOptional")}</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input-field" placeholder={te("emailPlaceholder")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-content-secondary">{t("role")}</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="input-field">
                    <option value="STAFF">{te("roleStaff")}</option>
                    <option value="BRANCH_MANAGER">{te("roleBranchManager")}</option>
                  </select>
                </div>
                <button onClick={handleCreate} disabled={creating || !form.firstName || !form.lastName || !form.phone} className="btn-primary w-full py-3">
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {creating ? tc("loading") : t("addStaff")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Employee Detail / Edit Drawer */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedEmployee(null); setIsEditing(false); setError(""); }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-surface-elevated p-6 shadow-large">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-content-primary">{isEditing ? te("editEmployee") : te("employeeDetails")}</h2>
                <button onClick={() => { setSelectedEmployee(null); setIsEditing(false); setError(""); }} className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary"><X size={18} /></button>
              </div>
              {selectedEmployee && !isEditing && (
                <DrawerViewContent employee={selectedEmployee} te={te} tc={tc} getRoleConfig={getRoleConfig} formatDate={formatDate} onEdit={openEdit} onToggleActive={handleToggleActive} toggling={toggling} />
              )}
              {selectedEmployee && isEditing && (
                <DrawerEditContent editForm={editForm} setEditForm={setEditForm} te={te} tc={tc} error={error} saving={saving} onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} getRoleConfig={getRoleConfig} />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══ Employee Card ═══ */
function EmployeeCard({ employee, index, onClick, getRoleConfig, te }: { employee: Employee; index: number; onClick: () => void; getRoleConfig: (role: string) => { label: string; color: string; bg: string; icon: any }; te: any }) {
  const rc = getRoleConfig(employee.role);
  const RoleIcon = rc.icon;
  const initials = `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase();
  const roleAccent = employee.role === "TENANT_ADMIN" ? "from-accent-primary to-accent-secondary" : employee.role === "BRANCH_MANAGER" ? "from-status-warning to-amber-500" : "from-status-info to-blue-500";

  return (
    <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035, duration: 0.35, ease: "easeOut" }} onClick={onClick}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-surface-elevated text-left shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-0.5 ${!employee.isActive ? "opacity-55" : ""}`}>
      <div className={`h-1 w-full bg-gradient-to-r ${roleAccent} opacity-70 transition-opacity group-hover:opacity-100`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold transition-shadow ${employee.isActive ? `bg-gradient-to-br ${roleAccent} text-white shadow-sm` : "bg-surface-tertiary text-content-tertiary"}`}>{initials}</div>
            <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface-elevated ${employee.isActive ? "bg-status-success" : "bg-content-tertiary"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold leading-snug text-content-primary">{employee.firstName} {employee.lastName}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-content-tertiary"><Phone size={11} className="shrink-0" /><span className="truncate">{employee.phone}</span></p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-content-tertiary/50 transition-all group-hover:translate-x-0.5 group-hover:text-content-tertiary" />
        </div>
        <div className="my-3.5 h-px bg-surface-secondary" />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${rc.bg} ${rc.color}`}><RoleIcon size={10} />{rc.label}</span>
          {employee.email && <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary px-2 py-1 text-[11px] font-medium text-content-secondary"><Mail size={10} />{employee.email}</span>}
        </div>
      </div>
    </motion.button>
  );
}

/* ═══ Drawer View ═══ */
function DrawerViewContent({ employee, te, tc, getRoleConfig, formatDate, onEdit, onToggleActive, toggling }: { employee: Employee; te: any; tc: any; getRoleConfig: (role: string) => { label: string; color: string; bg: string; icon: any }; formatDate: (d: string) => string; onEdit: () => void; onToggleActive: () => void; toggling: boolean }) {
  const rc = getRoleConfig(employee.role);
  const RoleIcon = rc.icon;
  const initials = `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${employee.isActive ? "bg-status-success/10 text-status-success" : "bg-surface-tertiary text-content-tertiary"}`}>
          {employee.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {employee.isActive ? te("active") : te("inactive")}
        </div>
        <button onClick={onEdit} className="btn-ghost flex items-center gap-1.5 text-sm"><Pencil size={14} />{tc("edit")}</button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary text-lg font-bold text-white shadow-sm">{initials}</div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">{employee.firstName} {employee.lastName}</h3>
          <div className={`flex items-center gap-1.5 text-sm ${rc.color}`}><RoleIcon size={14} />{rc.label}</div>
        </div>
      </div>
      <div className="space-y-0.5 overflow-hidden rounded-xl bg-surface-secondary/60">
        {employee.phone && <DetailRow icon={<Phone size={15} />} label={te("phone")} value={employee.phone} />}
        {employee.email && <DetailRow icon={<Mail size={15} />} label={te("email")} value={employee.email} />}
        {employee.telegramId && <DetailRow icon={<Send size={15} />} label="Telegram" value={employee.telegramId} />}
      </div>
      <div className="rounded-xl bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10"><Shield size={16} className="text-accent-primary" /></div>
          <div>
            <p className="text-sm font-semibold text-content-primary">{rc.label}</p>
            <p className="mt-0.5 text-xs text-content-secondary">{employee.role === "BRANCH_MANAGER" ? te("roleBranchManagerDesc") : te("roleStaffDesc")}</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-surface-secondary/60 p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs"><span className="text-content-tertiary">{te("joinedOn")}</span><span className="font-medium text-content-secondary">{formatDate(employee.createdAt)}</span></div>
          {employee.updatedAt && <div className="flex justify-between text-xs"><span className="text-content-tertiary">{te("lastUpdated")}</span><span className="font-medium text-content-secondary">{formatDate(employee.updatedAt)}</span></div>}
        </div>
      </div>
      <div className="rounded-xl border border-surface-tertiary p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-content-primary">{employee.isActive ? te("deactivateEmployee") : te("activateEmployee")}</p>
            <p className="mt-0.5 text-xs text-content-tertiary">{employee.isActive ? te("deactivateDesc") : te("activateDesc")}</p>
          </div>
          <button onClick={onToggleActive} disabled={toggling} className="transition-colors">
            {toggling ? <Loader2 size={28} className="animate-spin text-content-tertiary" /> : employee.isActive ? <ToggleRight size={32} className="text-status-success" /> : <ToggleLeft size={32} className="text-content-tertiary" />}
          </button>
        </div>
      </div>
      <button onClick={onEdit} className="btn-primary w-full justify-center"><Pencil size={16} />{te("editEmployee")}</button>
    </div>
  );
}

/* ═══ Drawer Edit ═══ */
function DrawerEditContent({ editForm, setEditForm, te, tc, error, saving, onSubmit, onCancel, getRoleConfig }: { editForm: { firstName: string; lastName: string; phone: string; role: string }; setEditForm: (f: any) => void; te: any; tc: any; error: string; saving: boolean; onSubmit: (e: React.FormEvent) => void; onCancel: () => void; getRoleConfig: (role: string) => { label: string; color: string; bg: string; icon: any } }) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error">{error}</motion.div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-content-secondary">{te("firstName")}</label>
          <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-content-secondary">{te("lastName")}</label>
          <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required className="input-field" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-content-secondary">{te("phone")}</label>
        <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required className="input-field" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-content-secondary">{te("role")}</label>
        <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="input-field">
          {ROLES.map((role) => { const rc = getRoleConfig(role); return <option key={role} value={role}>{rc.label}</option>; })}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">{tc("cancel")}</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {tc("save")}
        </button>
      </div>
      <div className="rounded-xl bg-surface-secondary/60 p-4">
        <div className="flex items-start gap-2"><FileText size={14} className="mt-0.5 shrink-0 text-content-tertiary" /><p className="text-xs text-content-tertiary">{te("editNote")}</p></div>
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
