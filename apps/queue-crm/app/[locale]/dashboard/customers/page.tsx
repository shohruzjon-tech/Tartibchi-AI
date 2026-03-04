"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Phone,
  Mail,
  Pencil,
  Loader2,
  UserCircle,
  Calendar,
  Hash,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Send,
  SlidersHorizontal,
  Sparkles,
  Signal,
  Users,
  TrendingUp,
} from "lucide-react";
import { api } from "../../../../lib/api";
import { useAuthStore } from "../../../../lib/store";
import { Drawer } from "../../../../components/ui/drawer";
import { PhoneInput } from "../../../../components/ui/phone-input";
import { FilterModal } from "../../../../components/ui/filter-modal";

/* ───── Types ───── */
interface Customer {
  _id: string;
  phone: string;
  firstName: string;
  lastName?: string;
  tenantId: string;
  telegramId?: string;
  telegramChatId?: string;
  email?: string;
  totalVisits: number;
  lastVisitAt?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("customers");
  const tcom = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTelegram, setFilterTelegram] = useState("");

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    phone: "+998",
    email: "",
    notes: "",
  });

  /* Fetch */
  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.customers.list(
        { search: searchQuery || undefined },
        token,
      );
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /* Search debounce */
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(debouncedSearch), 300);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  /* Handlers */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      const newCustomer = await api.customers.create(
        {
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          phone: createForm.phone,
          email: createForm.email || undefined,
          notes: createForm.notes || undefined,
        },
        token,
      );
      setCustomers((prev) => [newCustomer, ...prev]);
      setIsCreating(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        phone: "+998",
        email: "",
        notes: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCustomer) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await api.customers.update(
        selectedCustomer._id,
        {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
          email: editForm.email || undefined,
          notes: editForm.notes || undefined,
        },
        token,
      );
      setCustomers((prev) =>
        prev.map((c) => (c._id === selectedCustomer._id ? updated : c)),
      );
      setSelectedCustomer(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!token || !selectedCustomer) return;
    setSaving(true);
    try {
      const updated = await api.customers.update(
        selectedCustomer._id,
        { isActive: !selectedCustomer.isActive },
        token,
      );
      setCustomers((prev) =>
        prev.map((c) => (c._id === selectedCustomer._id ? updated : c)),
      );
      setSelectedCustomer(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !selectedCustomer) return;
    setDeleting(true);
    try {
      await api.customers.delete(selectedCustomer._id, token);
      setCustomers((prev) =>
        prev.filter((c) => c._id !== selectedCustomer._id),
      );
      setSelectedCustomer(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = () => {
    if (!selectedCustomer) return;
    setEditForm({
      firstName: selectedCustomer.firstName,
      lastName: selectedCustomer.lastName || "",
      phone: selectedCustomer.phone || "+998",
      email: selectedCustomer.email || "",
      notes: selectedCustomer.notes || "",
    });
    setIsEditing(true);
    setError(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
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

  /* Filtered data */
  const filteredCustomers = customers.filter((c) => {
    const matchStatus =
      filterStatus === "active"
        ? c.isActive
        : filterStatus === "inactive"
          ? !c.isActive
          : true;
    const matchTelegram =
      filterTelegram === "linked"
        ? !!c.telegramId
        : filterTelegram === "unlinked"
          ? !c.telegramId
          : true;
    return matchStatus && matchTelegram;
  });

  const activeCustomers = customers.filter((c) => c.isActive);
  const totalVisits = customers.reduce((sum, c) => sum + c.totalVisits, 0);
  const telegramLinked = customers.filter((c) => c.telegramId).length;
  const activeFilterCount = [filterStatus, filterTelegram].filter(
    Boolean,
  ).length;

  /* Filter modal config */
  const filterGroups = [
    {
      key: "status",
      label: tcom("status") || "Status",
      icon: <Signal size={12} />,
      options: [
        { id: "active", label: tc("active"), count: activeCustomers.length },
        {
          id: "inactive",
          label: tc("inactive"),
          count: customers.length - activeCustomers.length,
        },
      ],
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: <Send size={12} />,
      options: [
        { id: "linked", label: tc("telegramLinked"), count: telegramLinked },
        {
          id: "unlinked",
          label: "Not linked",
          count: customers.length - telegramLinked,
        },
      ],
    },
  ];

  const filterValues: Record<string, string | string[]> = {
    status: filterStatus,
    telegram: filterTelegram,
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    const v = typeof value === "string" ? value : value[0] || "";
    if (key === "status") setFilterStatus(v);
    else if (key === "telegram") setFilterTelegram(v);
  };

  const handleFilterReset = () => {
    setFilterStatus("");
    setFilterTelegram("");
    setDebouncedSearch("");
  };

  return (
    <div className="cyber-grid-bg min-h-[calc(100vh-4rem)]">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb h-64 w-64 bg-accent-primary/5 -top-20 -right-20" />
        <div
          className="orb h-48 w-48 bg-accent-secondary/5 bottom-20 -left-16"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* Header */}
      <div className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
            <Users size={20} className="text-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              {tc("title")}
            </h1>
            <p className="text-xs text-content-tertiary">{tc("subtitle")}</p>
          </div>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsCreating(true)}
          className="btn-cyber"
        >
          <Plus size={16} />
          {tc("addCustomer")}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: tc("totalCustomers"),
            value: customers.length,
            color: "text-content-primary",
            accent: "from-accent-primary/10 to-accent-secondary/5",
            icon: <Users size={14} className="text-accent-primary" />,
          },
          {
            label: tc("activeCustomers"),
            value: activeCustomers.length,
            color: "text-status-success neon-text",
            accent: "from-status-success/10 to-status-success/5",
            icon: <Sparkles size={14} className="text-status-success" />,
          },
          {
            label: tc("totalVisits"),
            value: totalVisits,
            color: "text-accent-primary",
            accent: "from-accent-primary/10 to-accent-primary/5",
            icon: <TrendingUp size={14} className="text-accent-primary" />,
          },
          {
            label: tc("telegramLinked"),
            value: telegramLinked,
            color: "text-status-info",
            accent: "from-status-info/10 to-status-info/5",
            icon: <Send size={14} className="text-status-info" />,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="cyber-stat px-4 py-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${stat.accent}`}
              >
                {stat.icon}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                {stat.label}
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${stat.color} animate-counter-up`}
            >
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-8 flex items-center gap-3"
      >
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary"
          />
          <input
            type="text"
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            placeholder={tcom("search")}
            className="cyber-input h-10 pl-9 text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            activeFilterCount > 0
              ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shadow-[0_0_16px_rgba(52,211,153,0.08)]"
              : "bg-surface-secondary text-content-secondary hover:bg-surface-tertiary border border-transparent"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">
            {tcom("filters") || "Filters"}
          </span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </motion.div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="relative">
            <Loader2 size={28} className="animate-spin text-accent-primary" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Loader2 size={28} className="text-accent-primary" />
            </div>
          </div>
          <p className="text-xs text-content-tertiary animate-pulse">
            Loading customers…
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/5 animate-neon-pulse">
            <UserCircle size={36} className="text-accent-primary/60" />
          </div>
          <h3 className="text-lg font-semibold text-content-primary">
            {tc("noCustomers")}
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-content-tertiary">
            {tc("noCustomersDesc")}
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-cyber mt-5 inline-flex"
          >
            <Plus size={16} />
            {tc("addCustomer")}
          </button>
        </motion.div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCustomers.map((customer, i) => (
            <motion.div
              key={customer._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.04,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => {
                setSelectedCustomer(customer);
                setIsEditing(false);
                setError(null);
              }}
              className={`futuristic-card group cursor-pointer p-5 transition-all ${!customer.isActive ? "opacity-50" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar with glow */}
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary/15 to-accent-secondary/10 text-sm font-bold text-accent-primary">
                  {customer.firstName.charAt(0).toUpperCase()}
                  {customer.lastName
                    ? customer.lastName.charAt(0).toUpperCase()
                    : ""}
                  {customer.isActive && (
                    <div
                      className="absolute -top-0.5 -right-0.5 status-dot-active"
                      style={{ width: 8, height: 8 }}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-content-primary group-hover:text-accent-primary transition-colors">
                      {customer.firstName} {customer.lastName || ""}
                    </h3>
                    {!customer.isActive && (
                      <span className="rounded-lg bg-status-error/10 px-2 py-0.5 text-[10px] font-semibold text-status-error border border-status-error/15">
                        {tc("inactive")}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-content-tertiary">
                    <Phone size={11} />
                    <span>{customer.phone}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="holo-badge inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium text-accent-primary">
                      <Hash size={10} />
                      {customer.totalVisits} {tc("visits")}
                    </span>
                    {customer.telegramId && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-status-info/10 px-2 py-0.5 text-[11px] font-medium text-status-info border border-status-info/15">
                        <Send size={10} />
                        Telegram
                      </span>
                    )}
                    {customer.lastVisitAt && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary/80 px-2 py-0.5 text-[11px] text-content-tertiary">
                        <Calendar size={10} />
                        {formatDate(customer.lastVisitAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title={tcom("filters") || "Filters"}
        groups={filterGroups}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        searchValue={debouncedSearch}
        onSearchChange={setDebouncedSearch}
        searchPlaceholder={tcom("search")}
      />

      {/* Detail Drawer */}
      <Drawer
        isOpen={!!selectedCustomer && !isEditing}
        onClose={() => setSelectedCustomer(null)}
        title={tc("customerDetails")}
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 text-xl font-bold text-accent-primary shadow-[0_0_24px_rgba(52,211,153,0.1)]">
                {selectedCustomer.firstName.charAt(0).toUpperCase()}
                {selectedCustomer.lastName
                  ? selectedCustomer.lastName.charAt(0).toUpperCase()
                  : ""}
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-primary">
                  {selectedCustomer.firstName} {selectedCustomer.lastName || ""}
                </h3>
                <div
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-semibold mt-1 ${selectedCustomer.isActive ? "bg-status-success/10 text-status-success border border-status-success/20" : "bg-status-error/10 text-status-error border border-status-error/20"}`}
                >
                  {selectedCustomer.isActive ? (
                    <span
                      className="status-dot-active"
                      style={{ width: 6, height: 6 }}
                    />
                  ) : (
                    <XCircle size={10} />
                  )}
                  {selectedCustomer.isActive ? tc("active") : tc("inactive")}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="space-y-1 overflow-hidden rounded-2xl">
              <InfoRow
                icon={<Phone size={14} />}
                label={tc("phone")}
                value={selectedCustomer.phone}
              />
              {selectedCustomer.email && (
                <InfoRow
                  icon={<Mail size={14} />}
                  label={tc("email")}
                  value={selectedCustomer.email}
                />
              )}
              <InfoRow
                icon={<Hash size={14} />}
                label={tc("totalVisits")}
                value={String(selectedCustomer.totalVisits)}
              />
              <InfoRow
                icon={<Calendar size={14} />}
                label={tc("lastVisit")}
                value={formatDate(selectedCustomer.lastVisitAt)}
              />
              {selectedCustomer.telegramId && (
                <InfoRow
                  icon={<Send size={14} />}
                  label="Telegram ID"
                  value={selectedCustomer.telegramId}
                />
              )}
              <InfoRow
                icon={<Calendar size={14} />}
                label={tc("registeredOn")}
                value={formatDate(selectedCustomer.createdAt)}
              />
              {selectedCustomer.notes && (
                <InfoRow
                  icon={<MessageSquare size={14} />}
                  label={tc("notes")}
                  value={selectedCustomer.notes}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={openEdit} className="btn-cyber w-full">
                <Pencil size={14} />
                {tcom("edit")}
              </button>
              <button
                onClick={handleToggleActive}
                disabled={saving}
                className="btn-secondary w-full justify-center"
              >
                {selectedCustomer.isActive ? (
                  <>
                    <ToggleRight size={14} />
                    {tc("deactivate")}
                  </>
                ) : (
                  <>
                    <ToggleLeft size={14} />
                    {tc("activate")}
                  </>
                )}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-ghost w-full text-status-error hover:bg-status-error/8 justify-center"
              >
                {deleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {tcom("delete")}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title={tc("editCustomer")}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-status-error/10 px-4 py-3 text-sm text-status-error border border-status-error/15">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("firstName")}
            </label>
            <input
              className="cyber-input"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, firstName: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("lastName")}
            </label>
            <input
              className="cyber-input"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, lastName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("phone")}
            </label>
            <PhoneInput
              value={editForm.phone}
              onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("email")}
            </label>
            <input
              type="email"
              className="cyber-input"
              value={editForm.email}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("notes")}
            </label>
            <textarea
              className="cyber-input"
              rows={3}
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary flex-1"
            >
              {tcom("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-cyber flex-1"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {tcom("save")}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Create Drawer */}
      <Drawer
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title={tc("addCustomer")}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-status-error/10 px-4 py-3 text-sm text-status-error border border-status-error/15">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("firstName")}
            </label>
            <input
              className="cyber-input"
              value={createForm.firstName}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, firstName: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("lastName")}
            </label>
            <input
              className="cyber-input"
              value={createForm.lastName}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, lastName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("phone")}
            </label>
            <PhoneInput
              value={createForm.phone}
              onChange={(v) => setCreateForm((f) => ({ ...f, phone: v }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("email")}
            </label>
            <input
              type="email"
              className="cyber-input"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tc("notes")}
            </label>
            <textarea
              className="cyber-input"
              rows={3}
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="btn-secondary flex-1"
            >
              {tcom("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-cyber flex-1"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              {tcom("create")}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

/* ═══ Info Row ═══ */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-surface-secondary/40 px-4 py-3.5 border-b border-accent-primary/5 last:border-b-0">
      <span className="mt-0.5 text-accent-primary/60">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-content-tertiary">
          {label}
        </div>
        <div className="mt-0.5 text-sm font-semibold text-content-primary">
          {value}
        </div>
      </div>
    </div>
  );
}
