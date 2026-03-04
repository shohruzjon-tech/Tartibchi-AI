"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Loader2,
  Building2,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  UserCog,
  UserCheck,
  FileText,
  Send,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react";
import { api } from "../../../../lib/api";
import { useAuthStore } from "../../../../lib/store";
import { Drawer } from "../../../../components/ui/drawer";
import { Modal } from "../../../../components/ui/modal";
import { CustomSelect } from "../../../../components/ui/custom-select";
import { PhoneInput } from "../../../../components/ui/phone-input";
import { Link } from "../../../../i18n/navigation";

/* ───── Types ───── */
interface Employee {
  _id: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegramId?: string;
  role: string;
  tenantId?: string;
  branchId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Branch {
  _id: string;
  name: string;
  isActive: boolean;
}

/* ───── Constants ───── */
const ROLES = ["STAFF", "BRANCH_MANAGER", "TENANT_ADMIN"] as const;

export default function EmployeesPage() {
  const t = useTranslations("dashboard");
  const te = useTranslations("employees");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  /* ─── State ─── */
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranchIds, setFilterBranchIds] = useState<string[]>([]);
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Temporary filter state for the modal */
  const [tempBranchIds, setTempBranchIds] = useState<string[]>([]);
  const [tempRoles, setTempRoles] = useState<string[]>([]);
  const [tempStatus, setTempStatus] = useState<string>("");

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "STAFF",
    branchId: "",
  });

  /* ─── Fetch ─── */
  const fetchEmployees = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.employees.list({ tenantId: user.tenantId }, token);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, token]);

  const fetchBranches = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.branches.list(user.tenantId, token);
      const list = Array.isArray(data) ? data : [];
      setBranches(list);
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId, token]);

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, [fetchEmployees, fetchBranches]);

  /* ─── Handlers ─── */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedEmployee) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await api.employees.update(
        selectedEmployee._id,
        {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
          role: editForm.role,
          branchId: editForm.branchId,
        },
        token,
      );
      setEmployees((prev) =>
        prev.map((e) => (e._id === selectedEmployee._id ? updated : e)),
      );
      setSelectedEmployee(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update employee");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!token || !selectedEmployee) return;
    setToggling(true);
    try {
      const updated = await api.employees.update(
        selectedEmployee._id,
        { isActive: !selectedEmployee.isActive },
        token,
      );
      setEmployees((prev) =>
        prev.map((e) => (e._id === selectedEmployee._id ? updated : e)),
      );
      setSelectedEmployee(updated);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  const openEdit = () => {
    if (!selectedEmployee) return;
    setEditForm({
      firstName: selectedEmployee.firstName,
      lastName: selectedEmployee.lastName,
      phone: selectedEmployee.phone || "+998",
      role: selectedEmployee.role,
      branchId: selectedEmployee.branchId || "",
    });
    setIsEditing(true);
    setError(null);
  };

  /* ─── Filter modal handlers ─── */
  const openFilters = () => {
    setTempBranchIds([...filterBranchIds]);
    setTempRoles([...filterRoles]);
    setTempStatus(filterStatus);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setFilterBranchIds(tempBranchIds);
    setFilterRoles(tempRoles);
    setFilterStatus(tempStatus);
    setFiltersOpen(false);
  };

  const clearAllFilters = () => {
    setTempBranchIds([]);
    setTempRoles([]);
    setTempStatus("");
  };

  const removeFilterBranch = (id: string) => {
    setFilterBranchIds((prev) => prev.filter((b) => b !== id));
  };

  const removeFilterRole = (role: string) => {
    setFilterRoles((prev) => prev.filter((r) => r !== role));
  };

  const removeFilterStatus = () => {
    setFilterStatus("");
  };

  const activeFilterCount =
    filterBranchIds.length + filterRoles.length + (filterStatus ? 1 : 0);

  const tempFilterCount =
    tempBranchIds.length + tempRoles.length + (tempStatus ? 1 : 0);

  /* ─── Helpers ─── */
  const getBranchName = (branchId?: string) =>
    branchId
      ? branches.find((b) => b._id === branchId)?.name || "—"
      : te("unassigned");

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "TENANT_ADMIN":
        return {
          label: te("roleTenantAdmin"),
          color: "text-accent-primary",
          bg: "bg-accent-primary/8",
          icon: ShieldCheck,
        };
      case "BRANCH_MANAGER":
        return {
          label: te("roleBranchManager"),
          color: "text-status-warning",
          bg: "bg-status-warning/8",
          icon: UserCog,
        };
      default:
        return {
          label: te("roleStaff"),
          color: "text-status-info",
          bg: "bg-status-info/8",
          icon: UserCheck,
        };
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchBranch =
        filterBranchIds.length > 0
          ? filterBranchIds.includes(emp.branchId || "")
          : true;
      const matchRole =
        filterRoles.length > 0 ? filterRoles.includes(emp.role) : true;
      const matchStatus =
        filterStatus === "active"
          ? emp.isActive
          : filterStatus === "inactive"
            ? !emp.isActive
            : true;
      const s = searchQuery.toLowerCase();
      const matchSearch =
        !s ||
        emp.firstName.toLowerCase().includes(s) ||
        emp.lastName.toLowerCase().includes(s) ||
        (emp.email && emp.email.toLowerCase().includes(s)) ||
        emp.phone.includes(s);
      return matchBranch && matchRole && matchSearch && matchStatus;
    });
  }, [employees, filterBranchIds, filterRoles, filterStatus, searchQuery]);

  const activeEmployees = filteredEmployees.filter((e) => e.isActive);
  const inactiveEmployees = filteredEmployees.filter((e) => !e.isActive);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  /* ─── Stats ─── */
  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.isActive).length,
      managers: employees.filter(
        (e) => e.role === "BRANCH_MANAGER" || e.role === "TENANT_ADMIN",
      ).length,
      staff: employees.filter((e) => e.role === "STAFF").length,
    }),
    [employees],
  );

  /* ─── Render ─── */
  return (
    <div>
      {/* ─── Header ─── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">
            {t("staff")}
          </h1>
          <p className="mt-1 text-sm text-content-tertiary">{te("subtitle")}</p>
        </div>
        <Link href="/dashboard/employees/new" className="btn-primary shrink-0">
          <Plus size={16} />
          {te("addEmployee")}
        </Link>
      </div>

      {/* ─── Stats Strip ─── */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {[
          {
            label: te("totalEmployees"),
            value: stats.total,
            color: "text-content-primary",
            iconBg: "bg-surface-tertiary",
            icon: <Users size={14} className="text-content-secondary" />,
          },
          {
            label: te("activeEmployees"),
            value: stats.active,
            color: "text-status-success",
            iconBg: "bg-status-success/10",
            icon: <CheckCircle2 size={14} className="text-status-success" />,
          },
          {
            label: te("managers"),
            value: stats.managers,
            color: "text-status-warning",
            iconBg: "bg-status-warning/10",
            icon: <ShieldCheck size={14} className="text-status-warning" />,
          },
          {
            label: te("staffCount"),
            value: stats.staff,
            color: "text-status-info",
            iconBg: "bg-status-info/10",
            icon: <UserCheck size={14} className="text-status-info" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl bg-surface-elevated px-4 py-3.5 shadow-soft"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
            >
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-content-tertiary sm:text-[11px]">
                {stat.label}
              </p>
              <p className={`text-xl font-bold leading-tight ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search & Filter Bar ─── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={te("searchPlaceholder")}
            className="input-field h-10 pl-10 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-content-tertiary transition-colors hover:text-content-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={openFilters}
          className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all ${
            activeFilterCount > 0
              ? "border-accent-primary/30 bg-accent-primary/5 text-accent-primary"
              : "border-transparent bg-surface-secondary text-content-secondary hover:bg-surface-tertiary"
          }`}
        >
          <SlidersHorizontal size={15} />
          {te("filtersButton")}
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-primary px-1.5 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── Active Filter Chips ─── */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2">
              {filterBranchIds.map((id) => (
                <motion.button
                  key={`branch-${id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => removeFilterBranch(id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent-primary/8 px-2.5 py-1.5 text-xs font-semibold text-accent-primary transition-colors hover:bg-accent-primary/15"
                >
                  <Building2 size={11} />
                  {getBranchName(id)}
                  <X size={12} className="ml-0.5 opacity-60" />
                </motion.button>
              ))}
              {filterRoles.map((role) => {
                const rc = getRoleConfig(role);
                return (
                  <motion.button
                    key={`role-${role}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => removeFilterRole(role)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${rc.bg} ${rc.color}`}
                  >
                    <rc.icon size={11} />
                    {rc.label}
                    <X size={12} className="ml-0.5 opacity-60" />
                  </motion.button>
                );
              })}
              {filterStatus && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={removeFilterStatus}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    filterStatus === "active"
                      ? "bg-status-success/10 text-status-success"
                      : "bg-surface-tertiary text-content-tertiary"
                  }`}
                >
                  {filterStatus === "active" ? (
                    <CheckCircle2 size={11} />
                  ) : (
                    <XCircle size={11} />
                  )}
                  {filterStatus === "active" ? te("active") : te("inactive")}
                  <X size={12} className="ml-0.5 opacity-60" />
                </motion.button>
              )}
              <button
                onClick={() => {
                  setFilterBranchIds([]);
                  setFilterRoles([]);
                  setFilterStatus("");
                }}
                className="ml-1 text-xs font-medium text-content-tertiary transition-colors hover:text-content-primary"
              >
                {te("clearAll")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Results Count ─── */}
      {!loading && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-medium text-content-tertiary">
            {te("showingResults", {
              count: filteredEmployees.length,
              total: employees.length,
            })}
          </p>
        </div>
      )}

      {/* ─── Loading ─── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-accent-primary" />
          <p className="mt-3 text-sm text-content-tertiary">{tc("loading")}</p>
        </div>
      )}

      {/* ─── Employee Grid ─── */}
      {!loading && (
        <>
          {activeEmployees.length > 0 && (
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {te("activeEmployees")} ({activeEmployees.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeEmployees.map((emp, i) => (
                  <EmployeeCard
                    key={emp._id}
                    employee={emp}
                    index={i}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setIsEditing(false);
                      setError(null);
                    }}
                    getBranchName={getBranchName}
                    getRoleConfig={getRoleConfig}
                    te={te}
                  />
                ))}
              </div>
            </section>
          )}

          {inactiveEmployees.length > 0 && (
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-content-tertiary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {te("inactiveEmployees")} ({inactiveEmployees.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {inactiveEmployees.map((emp, i) => (
                  <EmployeeCard
                    key={emp._id}
                    employee={emp}
                    index={i}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setIsEditing(false);
                      setError(null);
                    }}
                    getBranchName={getBranchName}
                    getRoleConfig={getRoleConfig}
                    te={te}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {filteredEmployees.length === 0 && (
            <div className="py-24 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-secondary">
                <Users size={32} className="text-content-tertiary" />
              </div>
              <p className="text-base font-semibold text-content-secondary">
                {searchQuery || activeFilterCount > 0
                  ? tc("noResults")
                  : te("emptyTitle")}
              </p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-content-tertiary">
                {searchQuery || activeFilterCount > 0
                  ? te("tryDifferentSearch")
                  : te("emptyDesc")}
              </p>
              {!searchQuery && activeFilterCount === 0 && (
                <Link
                  href="/dashboard/employees/new"
                  className="btn-primary mt-5 inline-flex"
                >
                  <Plus size={16} />
                  {te("addEmployee")}
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── Filters Modal ─── */}
      <Modal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={te("filtersTitle")}
        size="sm"
      >
        <div className="space-y-6">
          {/* Status filter */}
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              {te("filterByStatus")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "",
                  label: te("allStatuses"),
                },
                {
                  value: "active",
                  label: te("active"),
                },
                {
                  value: "inactive",
                  label: te("inactive"),
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTempStatus(opt.value)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                    tempStatus === opt.value
                      ? "bg-accent-primary text-white shadow-glow"
                      : "bg-surface-secondary text-content-secondary hover:bg-surface-tertiary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Branch filter */}
          {branches.length > 0 && (
            <div>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {te("filterByBranch")}
              </h3>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {branches.map((branch) => {
                  const isSelected = tempBranchIds.includes(branch._id);
                  const count = employees.filter(
                    (e) => e.branchId === branch._id,
                  ).length;
                  return (
                    <button
                      key={branch._id}
                      onClick={() =>
                        setTempBranchIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== branch._id)
                            : [...prev, branch._id],
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all ${
                        isSelected
                          ? "bg-accent-primary/8"
                          : "hover:bg-surface-secondary"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                          isSelected
                            ? "border-accent-primary bg-accent-primary"
                            : "border-content-tertiary/40"
                        }`}
                      >
                        {isSelected && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 items-center justify-between">
                        <span
                          className={`text-sm font-medium ${isSelected ? "text-accent-primary" : "text-content-primary"}`}
                        >
                          {branch.name}
                        </span>
                        <span className="ml-2 text-xs text-content-tertiary">
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role filter */}
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              {te("filterByRole")}
            </h3>
            <div className="space-y-1">
              {ROLES.map((role) => {
                const rc = getRoleConfig(role);
                const RIcon = rc.icon;
                const isSelected = tempRoles.includes(role);
                const count = employees.filter((e) => e.role === role).length;
                return (
                  <button
                    key={role}
                    onClick={() =>
                      setTempRoles((prev) =>
                        isSelected
                          ? prev.filter((r) => r !== role)
                          : [...prev, role],
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-accent-primary/8"
                        : "hover:bg-surface-secondary"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                        isSelected
                          ? "border-accent-primary bg-accent-primary"
                          : "border-content-tertiary/40"
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${rc.bg}`}
                      >
                        <RIcon size={13} className={rc.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-sm font-medium ${isSelected ? "text-accent-primary" : "text-content-primary"}`}
                        >
                          {rc.label}
                        </span>
                      </div>
                      <span className="text-xs text-content-tertiary">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-surface-tertiary pt-4">
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={tempFilterCount === 0}
              className="btn-ghost flex-1 text-sm disabled:opacity-40"
            >
              {te("clearAll")}
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="btn-primary flex-1"
            >
              {te("applyFilters")}
              {tempFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[11px]">
                  {tempFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Employee Detail / Edit Drawer ─── */}
      <Drawer
        isOpen={!!selectedEmployee}
        onClose={() => {
          setSelectedEmployee(null);
          setIsEditing(false);
          setError(null);
        }}
        title={isEditing ? te("editEmployee") : te("employeeDetails")}
      >
        {selectedEmployee && !isEditing && (
          <DrawerViewContent
            employee={selectedEmployee}
            te={te}
            tc={tc}
            getBranchName={getBranchName}
            getRoleConfig={getRoleConfig}
            formatDate={formatDate}
            onEdit={openEdit}
            onToggleActive={handleToggleActive}
            toggling={toggling}
          />
        )}
        {selectedEmployee && isEditing && (
          <DrawerEditContent
            employee={selectedEmployee}
            editForm={editForm}
            setEditForm={setEditForm}
            te={te}
            tc={tc}
            branches={branches}
            error={error}
            saving={saving}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            getRoleConfig={getRoleConfig}
          />
        )}
      </Drawer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Employee Card — Redesigned
   ═══════════════════════════════════════════════════════ */
function EmployeeCard({
  employee,
  index,
  onClick,
  getBranchName,
  getRoleConfig,
  te,
}: {
  employee: Employee;
  index: number;
  onClick: () => void;
  getBranchName: (id?: string) => string;
  getRoleConfig: (role: string) => {
    label: string;
    color: string;
    bg: string;
    icon: any;
  };
  te: any;
}) {
  const rc = getRoleConfig(employee.role);
  const RoleIcon = rc.icon;
  const initials =
    `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase();

  const roleAccent =
    employee.role === "TENANT_ADMIN"
      ? "from-accent-primary to-accent-secondary"
      : employee.role === "BRANCH_MANAGER"
        ? "from-status-warning to-amber-500"
        : "from-status-info to-blue-500";

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.35, ease: "easeOut" }}
      onClick={onClick}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-surface-elevated text-left shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-0.5 ${
        !employee.isActive ? "opacity-55" : ""
      }`}
    >
      {/* Top accent bar */}
      <div
        className={`h-1 w-full bg-gradient-to-r ${roleAccent} opacity-70 transition-opacity group-hover:opacity-100`}
      />

      <div className="p-4 sm:p-5">
        {/* Top row: Avatar + Name + Arrow */}
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold transition-shadow ${
                employee.isActive
                  ? `bg-gradient-to-br ${roleAccent} text-white shadow-sm`
                  : "bg-surface-tertiary text-content-tertiary"
              }`}
            >
              {initials}
            </div>
            {/* Online indicator */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface-elevated ${
                employee.isActive ? "bg-status-success" : "bg-content-tertiary"
              }`}
            />
          </div>

          {/* Name + Phone */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold leading-snug text-content-primary">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-content-tertiary">
              <Phone size={11} className="shrink-0" />
              <span className="truncate">{employee.phone}</span>
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight
            size={16}
            className="shrink-0 text-content-tertiary/50 transition-all group-hover:translate-x-0.5 group-hover:text-content-tertiary"
          />
        </div>

        {/* Divider */}
        <div className="my-3.5 h-px bg-surface-secondary" />

        {/* Bottom row: Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Role chip */}
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${rc.bg} ${rc.color}`}
          >
            <RoleIcon size={10} />
            {rc.label}
          </span>

          {/* Branch chip */}
          <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary px-2 py-1 text-[11px] font-medium text-content-secondary">
            <Building2 size={10} />
            {getBranchName(employee.branchId)}
          </span>

          {/* Email chip — if available */}
          {employee.email && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary px-2 py-1 text-[11px] font-medium text-content-secondary">
              <Mail size={10} />
              {employee.email}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════
   Drawer View Content
   ═══════════════════════════════════════════════════════ */
function DrawerViewContent({
  employee,
  te,
  tc,
  getBranchName,
  getRoleConfig,
  formatDate,
  onEdit,
  onToggleActive,
  toggling,
}: {
  employee: Employee;
  te: any;
  tc: any;
  getBranchName: (id?: string) => string;
  getRoleConfig: (role: string) => {
    label: string;
    color: string;
    bg: string;
    icon: any;
  };
  formatDate: (d: string) => string;
  onEdit: () => void;
  onToggleActive: () => void;
  toggling: boolean;
}) {
  const rc = getRoleConfig(employee.role);
  const RoleIcon = rc.icon;
  const initials =
    `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Status + Edit */}
      <div className="flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            employee.isActive
              ? "bg-status-success/10 text-status-success"
              : "bg-surface-tertiary text-content-tertiary"
          }`}
        >
          {employee.isActive ? (
            <CheckCircle2 size={12} />
          ) : (
            <XCircle size={12} />
          )}
          {employee.isActive ? te("active") : te("inactive")}
        </div>
        <button
          onClick={onEdit}
          className="btn-ghost flex items-center gap-1.5 text-sm"
        >
          <Pencil size={14} />
          {tc("edit")}
        </button>
      </div>

      {/* Employee Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary text-lg font-bold text-white shadow-sm">
          {initials}
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">
            {employee.firstName} {employee.lastName}
          </h3>
          <div className={`flex items-center gap-1.5 text-sm ${rc.color}`}>
            <RoleIcon size={14} />
            {rc.label}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-0.5 overflow-hidden rounded-xl bg-surface-secondary/60">
        <DetailRow
          icon={<Phone size={15} />}
          label={te("phone")}
          value={employee.phone}
        />
        {employee.email && (
          <DetailRow
            icon={<Mail size={15} />}
            label={te("email")}
            value={employee.email}
          />
        )}
        {employee.telegramId && (
          <DetailRow
            icon={<Send size={15} />}
            label="Telegram"
            value={employee.telegramId}
          />
        )}
      </div>

      {/* Assignment */}
      <div className="space-y-0.5 overflow-hidden rounded-xl bg-surface-secondary/60">
        <DetailRow
          icon={<Building2 size={15} />}
          label={te("branch")}
          value={getBranchName(employee.branchId)}
        />
        <DetailRow
          icon={<RoleIcon size={15} />}
          label={te("role")}
          value={rc.label}
        />
      </div>

      {/* Role Description Card */}
      <div className="rounded-xl bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
            <Shield size={16} className="text-accent-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-content-primary">
              {rc.label}
            </p>
            <p className="mt-0.5 text-xs text-content-secondary">
              {employee.role === "TENANT_ADMIN"
                ? te("roleTenantAdminDesc")
                : employee.role === "BRANCH_MANAGER"
                  ? te("roleBranchManagerDesc")
                  : te("roleStaffDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="rounded-xl bg-surface-secondary/60 p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-content-tertiary">{te("joinedOn")}</span>
            <span className="font-medium text-content-secondary">
              {formatDate(employee.createdAt)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-content-tertiary">{te("lastUpdated")}</span>
            <span className="font-medium text-content-secondary">
              {formatDate(employee.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Toggle Active */}
      <div className="rounded-xl border border-surface-tertiary p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-content-primary">
              {employee.isActive
                ? te("deactivateEmployee")
                : te("activateEmployee")}
            </p>
            <p className="mt-0.5 text-xs text-content-tertiary">
              {employee.isActive ? te("deactivateDesc") : te("activateDesc")}
            </p>
          </div>
          <button
            onClick={onToggleActive}
            disabled={toggling}
            className="transition-colors"
          >
            {toggling ? (
              <Loader2
                size={28}
                className="animate-spin text-content-tertiary"
              />
            ) : employee.isActive ? (
              <ToggleRight size={32} className="text-status-success" />
            ) : (
              <ToggleLeft size={32} className="text-content-tertiary" />
            )}
          </button>
        </div>
      </div>

      {/* Edit Button */}
      <button onClick={onEdit} className="btn-primary w-full justify-center">
        <Pencil size={16} />
        {te("editEmployee")}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Drawer Edit Content
   ═══════════════════════════════════════════════════════ */
function DrawerEditContent({
  employee,
  editForm,
  setEditForm,
  te,
  tc,
  branches,
  error,
  saving,
  onSubmit,
  onCancel,
  getRoleConfig,
}: {
  employee: Employee;
  editForm: {
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    branchId: string;
  };
  setEditForm: (f: any) => void;
  te: any;
  tc: any;
  branches: Branch[];
  error: string | null;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  getRoleConfig: (role: string) => {
    label: string;
    color: string;
    bg: string;
    icon: any;
  };
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error"
        >
          {error}
        </motion.div>
      )}

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-content-secondary">
            {te("firstName")}
          </label>
          <input
            type="text"
            value={editForm.firstName}
            onChange={(e) =>
              setEditForm({ ...editForm, firstName: e.target.value })
            }
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-content-secondary">
            {te("lastName")}
          </label>
          <input
            type="text"
            value={editForm.lastName}
            onChange={(e) =>
              setEditForm({ ...editForm, lastName: e.target.value })
            }
            required
            className="input-field"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-content-secondary">
          {te("phone")}
        </label>
        <PhoneInput
          value={editForm.phone}
          onChange={(v) => setEditForm({ ...editForm, phone: v })}
        />
      </div>

      {/* Role */}
      <CustomSelect
        label={te("role")}
        icon={<Shield size={16} />}
        options={ROLES.map((role) => {
          const rc = getRoleConfig(role);
          return {
            value: role,
            label: rc.label,
            description:
              role === "STAFF"
                ? te("roleStaffDesc")
                : role === "BRANCH_MANAGER"
                  ? te("roleBranchManagerDesc")
                  : te("roleTenantAdminDesc"),
          };
        })}
        value={editForm.role}
        onChange={(v) => setEditForm({ ...editForm, role: v })}
      />

      {/* Branch */}
      <CustomSelect
        label={te("assignBranch")}
        icon={<Building2 size={16} />}
        options={[
          { value: "", label: te("noBranch") },
          ...branches.map((b) => ({
            value: b._id,
            label: b.name,
          })),
        ]}
        value={editForm.branchId}
        onChange={(v) => setEditForm({ ...editForm, branchId: v })}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          {tc("cancel")}
        </button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {tc("save")}
        </button>
      </div>

      {/* Info note */}
      <div className="rounded-xl bg-surface-secondary/60 p-4">
        <div className="flex items-start gap-2">
          <FileText
            size={14}
            className="mt-0.5 shrink-0 text-content-tertiary"
          />
          <p className="text-xs text-content-tertiary">{te("editNote")}</p>
        </div>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   Detail Row
   ═══════════════════════════════════════════════════════ */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-surface-secondary/40 px-4 py-3">
      <span className="text-content-tertiary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-content-tertiary">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-content-primary">
          {value}
        </p>
      </div>
    </div>
  );
}
