"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ClipboardList,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Loader2,
  Building2,
  Hash,
  GitBranch,
  Layers,
  Activity,
  Zap,
  SlidersHorizontal,
  Sparkles,
  Signal,
} from "lucide-react";
import { api } from "../../../../lib/api";
import { useAuthStore } from "../../../../lib/store";
import { Modal } from "../../../../components/ui/modal";
import { Drawer } from "../../../../components/ui/drawer";
import { CustomSelect } from "../../../../components/ui/custom-select";
import { FilterModal } from "../../../../components/ui/filter-modal";

interface Service {
  _id: string;
  tenantId: string;
  branchId: string;
  name: string;
  prefix: string;
  strategy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Branch {
  _id: string;
  name: string;
  isActive: boolean;
}

export default function ServicesPage() {
  const t = useTranslations("dashboard");
  const ts = useTranslations("services");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStrategy, setFilterStrategy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    prefix: "",
    strategy: "FIFO",
    branchId: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    prefix: "",
    strategy: "FIFO",
  });

  const fetchServices = useCallback(async () => {
    if (!user?.tenantId) return;
    try {
      const data = await api.queues.list({ tenantId: user.tenantId });
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId]);

  const fetchBranches = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.branches.list(user.tenantId, token);
      const list = Array.isArray(data) ? data : [];
      setBranches(list);
      if (list.length > 0 && !createForm.branchId) {
        setCreateForm((prev) => ({ ...prev, branchId: list[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId, token]);

  useEffect(() => {
    fetchServices();
    fetchBranches();
  }, [fetchServices, fetchBranches]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      const newService = await api.queues.create(
        { ...createForm, tenantId: user?.tenantId },
        token,
      );
      setServices((prev) => [...prev, newService]);
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        prefix: "",
        strategy: "FIFO",
        branchId: branches[0]?._id || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create service");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedService) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await api.queues.update(
        selectedService._id,
        {
          name: editForm.name,
          prefix: editForm.prefix,
          strategy: editForm.strategy,
        },
        token,
      );
      setServices((prev) =>
        prev.map((s) => (s._id === selectedService._id ? updated : s)),
      );
      setSelectedService(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!token || !selectedService) return;
    setToggling(true);
    try {
      const updated = await api.queues.update(
        selectedService._id,
        { isActive: !selectedService.isActive },
        token,
      );
      setServices((prev) =>
        prev.map((s) => (s._id === selectedService._id ? updated : s)),
      );
      setSelectedService(updated);
    } catch (err: any) {
      setError(err.message || "Failed to update service status");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !selectedService) return;
    setSaving(true);
    try {
      await api.queues.delete(selectedService._id, token);
      setServices((prev) => prev.filter((s) => s._id !== selectedService._id));
      setSelectedService(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete service");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    if (!selectedService) return;
    setEditForm({
      name: selectedService.name,
      prefix: selectedService.prefix,
      strategy: selectedService.strategy,
    });
    setIsEditing(true);
    setError(null);
  };

  const getBranchName = (branchId: string) =>
    branches.find((b) => b._id === branchId)?.name || branchId;

  const filteredServices = services.filter((s) => {
    const matchBranch = filterBranchId ? s.branchId === filterBranchId : true;
    const matchStatus =
      filterStatus === "active"
        ? s.isActive
        : filterStatus === "inactive"
          ? !s.isActive
          : true;
    const matchStrategy = filterStrategy ? s.strategy === filterStrategy : true;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.prefix.toLowerCase().includes(q);
    return matchBranch && matchSearch && matchStatus && matchStrategy;
  });

  const activeServices = filteredServices.filter((s) => s.isActive);
  const inactiveServices = filteredServices.filter((s) => !s.isActive);
  const activeFilterCount = [
    filterBranchId,
    filterStatus,
    filterStrategy,
  ].filter(Boolean).length;

  const strategyConfig: Record<
    string,
    { color: string; icon: typeof Zap; label: string }
  > = {
    FIFO: { color: "text-status-info", icon: Layers, label: t("fifo") },
    PRIORITY: { color: "text-accent-primary", icon: Zap, label: t("priority") },
  };

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

  const filterGroups = [
    ...(branches.length > 1
      ? [
          {
            key: "branch",
            label: ts("branch"),
            icon: <Building2 size={12} />,
            options: branches.map((b) => ({
              id: b._id,
              label: b.name,
              count: services.filter((s) => s.branchId === b._id).length,
            })),
          },
        ]
      : []),
    {
      key: "status",
      label: ts("status"),
      icon: <Signal size={12} />,
      options: [
        {
          id: "active",
          label: ts("active"),
          count: services.filter((s) => s.isActive).length,
        },
        {
          id: "inactive",
          label: ts("inactive"),
          count: services.filter((s) => !s.isActive).length,
        },
      ],
    },
    {
      key: "strategy",
      label: ts("strategy"),
      icon: <GitBranch size={12} />,
      options: [
        {
          id: "FIFO",
          label: t("fifo"),
          count: services.filter((s) => s.strategy === "FIFO").length,
        },
        {
          id: "PRIORITY",
          label: t("priority"),
          count: services.filter((s) => s.strategy === "PRIORITY").length,
        },
      ],
    },
  ];

  const filterValues: Record<string, string | string[]> = {
    branch: filterBranchId,
    status: filterStatus,
    strategy: filterStrategy,
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    const v = typeof value === "string" ? value : value[0] || "";
    if (key === "branch") setFilterBranchId(v);
    else if (key === "status") setFilterStatus(v);
    else if (key === "strategy") setFilterStrategy(v);
  };

  const handleFilterReset = () => {
    setFilterBranchId("");
    setFilterStatus("");
    setFilterStrategy("");
    setSearchQuery("");
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
            <ClipboardList size={20} className="text-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              {t("services")}
            </h1>
            <p className="text-xs text-content-tertiary">{ts("subtitle")}</p>
          </div>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            setShowCreateModal(true);
            setError(null);
          }}
          className="btn-cyber"
        >
          <Plus size={16} />
          {t("createService")}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          {
            label: ts("totalServices"),
            value: services.length,
            color: "text-content-primary",
            accent: "from-accent-primary/10 to-accent-secondary/5",
            icon: <ClipboardList size={14} className="text-accent-primary" />,
          },
          {
            label: ts("activeServices"),
            value: services.filter((s) => s.isActive).length,
            color: "text-status-success neon-text",
            accent: "from-status-success/10 to-status-success/5",
            icon: <Sparkles size={14} className="text-status-success" />,
          },
          {
            label: ts("inactiveServices"),
            value: services.filter((s) => !s.isActive).length,
            color: "text-content-tertiary",
            accent: "from-content-tertiary/10 to-content-tertiary/5",
            icon: <XCircle size={14} className="text-content-tertiary" />,
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ts("searchPlaceholder")}
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
          <span className="hidden sm:inline">{tc("filters")}</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="relative">
            <Loader2 size={28} className="animate-spin text-accent-primary" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Loader2 size={28} className="text-accent-primary" />
            </div>
          </div>
          <p className="text-xs text-content-tertiary animate-pulse">
            Loading services…
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <>
          {activeServices.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="status-dot-active" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {ts("activeServices")} ({activeServices.length})
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-accent-primary/15 to-transparent" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeServices.map((service, i) => (
                  <ServiceCard
                    key={service._id}
                    service={service}
                    index={i}
                    onClick={() => {
                      setSelectedService(service);
                      setIsEditing(false);
                      setError(null);
                    }}
                    getBranchName={getBranchName}
                    strategyConfig={strategyConfig}
                    ts={ts}
                  />
                ))}
              </div>
            </div>
          )}

          {inactiveServices.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="status-dot-inactive" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {ts("inactiveServices")} ({inactiveServices.length})
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-content-tertiary/15 to-transparent" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {inactiveServices.map((service, i) => (
                  <ServiceCard
                    key={service._id}
                    service={service}
                    index={i}
                    onClick={() => {
                      setSelectedService(service);
                      setIsEditing(false);
                      setError(null);
                    }}
                    getBranchName={getBranchName}
                    strategyConfig={strategyConfig}
                    ts={ts}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredServices.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/5 animate-neon-pulse">
                <ClipboardList size={32} className="text-accent-primary/60" />
              </div>
              <p className="font-semibold text-content-secondary">
                {searchQuery || activeFilterCount
                  ? tc("noResults")
                  : ts("emptyTitle")}
              </p>
              <p className="mt-1.5 text-sm text-content-tertiary">
                {searchQuery || activeFilterCount
                  ? ts("tryDifferentSearch")
                  : ts("emptyDesc")}
              </p>
              {!searchQuery && !activeFilterCount && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-cyber mt-5 inline-flex"
                >
                  <Plus size={16} />
                  {t("createService")}
                </button>
              )}
            </motion.div>
          )}
        </>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title={tc("filters")}
        groups={filterGroups}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={ts("searchPlaceholder")}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError(null);
        }}
        title={t("createService")}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && !selectedService && (
            <div className="rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("serviceName")}
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              required
              className="cyber-input"
              placeholder={ts("namePlaceholder")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("servicePrefix")}
            </label>
            <input
              type="text"
              value={createForm.prefix}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  prefix: e.target.value.toUpperCase(),
                })
              }
              required
              maxLength={3}
              className="cyber-input"
              placeholder={ts("prefixPlaceholder")}
            />
            <p className="mt-1 text-xs text-content-tertiary">
              {ts("prefixHint")}
            </p>
          </div>
          <CustomSelect
            label={ts("selectBranch")}
            icon={<Building2 size={16} />}
            options={branches.map((b) => ({ value: b._id, label: b.name }))}
            value={createForm.branchId}
            onChange={(v) => setCreateForm({ ...createForm, branchId: v })}
          />
          <CustomSelect
            label={ts("strategy")}
            icon={<GitBranch size={16} />}
            options={[
              { value: "FIFO", label: t("fifo"), description: ts("fifoDesc") },
              {
                value: "PRIORITY",
                label: t("priority"),
                description: ts("priorityDesc"),
              },
            ]}
            value={createForm.strategy}
            onChange={(v) => setCreateForm({ ...createForm, strategy: v })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              {tc("cancel")}
            </button>
            <button type="submit" disabled={saving} className="btn-cyber">
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {tc("create")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail / Edit Drawer */}
      <Drawer
        isOpen={!!selectedService}
        onClose={() => {
          setSelectedService(null);
          setIsEditing(false);
          setError(null);
        }}
        title={isEditing ? ts("editService") : ts("serviceDetails")}
      >
        {selectedService && !isEditing && (
          <DrawerViewContent
            service={selectedService}
            ts={ts}
            tc={tc}
            t={t}
            getBranchName={getBranchName}
            strategyConfig={strategyConfig}
            formatDate={formatDate}
            onEdit={openEdit}
            onToggleActive={handleToggleActive}
            toggling={toggling}
          />
        )}
        {selectedService && isEditing && (
          <DrawerEditContent
            service={selectedService}
            editForm={editForm}
            setEditForm={setEditForm}
            ts={ts}
            tc={tc}
            t={t}
            error={error}
            saving={saving}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            onDelete={handleDelete}
          />
        )}
      </Drawer>
    </div>
  );
}

/* ═══ Service Card ═══ */
function ServiceCard({
  service,
  index,
  onClick,
  getBranchName,
  strategyConfig,
  ts,
}: {
  service: Service;
  index: number;
  onClick: () => void;
  getBranchName: (id: string) => string;
  strategyConfig: Record<
    string,
    { color: string; icon: typeof Zap; label: string }
  >;
  ts: any;
}) {
  const strat = strategyConfig[service.strategy] || strategyConfig.FIFO;
  const StratIcon = strat.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={onClick}
      className={`futuristic-card group w-full cursor-pointer p-5 text-left ${!service.isActive ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${service.isActive ? "bg-gradient-to-br from-accent-primary/15 to-accent-secondary/10" : "bg-surface-tertiary"}`}
          >
            <ClipboardList
              size={20}
              className={
                service.isActive
                  ? "text-accent-primary"
                  : "text-content-tertiary"
              }
            />
            {service.isActive && (
              <div
                className="absolute -top-0.5 -right-0.5 status-dot-active"
                style={{ width: 8, height: 8 }}
              />
            )}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-content-primary group-hover:text-accent-primary transition-colors">
              {service.name}
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-content-tertiary">
              <Building2 size={11} />
              {getBranchName(service.branchId)}
            </div>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="mt-1 text-content-tertiary transition-all group-hover:translate-x-1 group-hover:text-accent-primary"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="holo-badge inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wide text-accent-primary">
          <Hash size={10} />
          {service.prefix}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-lg bg-surface-secondary/80 px-2.5 py-1 text-[11px] font-medium ${strat.color}`}
        >
          <StratIcon size={10} />
          {strat.label}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
          {service.isActive ? (
            <span
              className="status-dot-active"
              style={{ width: 6, height: 6 }}
            />
          ) : (
            <span
              className="status-dot-inactive"
              style={{ width: 6, height: 6 }}
            />
          )}
          <span
            className={
              service.isActive ? "text-status-success" : "text-content-tertiary"
            }
          >
            {service.isActive ? ts("active") : ts("inactive")}
          </span>
        </span>
      </div>
    </motion.button>
  );
}

/* ═══ Drawer View ═══ */
function DrawerViewContent({
  service,
  ts,
  tc,
  t,
  getBranchName,
  strategyConfig,
  formatDate,
  onEdit,
  onToggleActive,
  toggling,
}: {
  service: Service;
  ts: any;
  tc: any;
  t: any;
  getBranchName: (id: string) => string;
  strategyConfig: Record<
    string,
    { color: string; icon: typeof Zap; label: string }
  >;
  formatDate: (d: string) => string;
  onEdit: () => void;
  onToggleActive: () => void;
  toggling: boolean;
}) {
  const strat = strategyConfig[service.strategy] || strategyConfig.FIFO;
  const StratIcon = strat.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold ${service.isActive ? "bg-status-success/10 text-status-success border border-status-success/20" : "bg-surface-tertiary text-content-tertiary"}`}
        >
          {service.isActive ? (
            <span
              className="status-dot-active"
              style={{ width: 8, height: 8 }}
            />
          ) : (
            <XCircle size={12} />
          )}
          {service.isActive ? ts("active") : ts("inactive")}
        </div>
        <button
          onClick={onEdit}
          className="btn-ghost flex items-center gap-1.5 text-sm"
        >
          <Pencil size={14} />
          {tc("edit")}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 shadow-[0_0_24px_rgba(52,211,153,0.1)]">
          <ClipboardList size={24} className="text-accent-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">
            {service.name}
          </h3>
          <p className="text-xs text-content-tertiary">
            {ts("createdOn")} {formatDate(service.createdAt)}
          </p>
        </div>
      </div>

      <div className="space-y-1 overflow-hidden rounded-2xl">
        <DetailRow
          icon={<Building2 size={15} />}
          label={ts("branch")}
          value={getBranchName(service.branchId)}
        />
        <DetailRow
          icon={<Hash size={15} />}
          label={ts("prefix")}
          value={service.prefix}
        />
        <DetailRow
          icon={<StratIcon size={15} />}
          label={ts("strategy")}
          value={strat.label}
        />
      </div>

      <div className="futuristic-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10">
            <Activity size={16} className="text-accent-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-content-primary">
              {service.strategy === "FIFO"
                ? ts("fifoTitle")
                : ts("priorityTitle")}
            </p>
            <p className="mt-0.5 text-xs text-content-secondary">
              {service.strategy === "FIFO"
                ? ts("fifoDesc")
                : ts("priorityDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="cyber-stat p-4">
        <div className="flex justify-between text-xs">
          <span className="text-content-tertiary">{ts("lastUpdated")}</span>
          <span className="font-medium text-content-secondary">
            {formatDate(service.updatedAt)}
          </span>
        </div>
      </div>

      <div className="futuristic-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-content-primary">
              {service.isActive
                ? ts("deactivateService")
                : ts("activateService")}
            </p>
            <p className="mt-0.5 text-xs text-content-tertiary">
              {service.isActive ? ts("deactivateDesc") : ts("activateDesc")}
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
            ) : service.isActive ? (
              <ToggleRight size={32} className="text-status-success" />
            ) : (
              <ToggleLeft size={32} className="text-content-tertiary" />
            )}
          </button>
        </div>
      </div>

      <button onClick={onEdit} className="btn-cyber w-full justify-center">
        <Pencil size={16} />
        {ts("editService")}
      </button>
    </div>
  );
}

/* ═══ Drawer Edit ═══ */
function DrawerEditContent({
  service,
  editForm,
  setEditForm,
  ts,
  tc,
  t,
  error,
  saving,
  onSubmit,
  onCancel,
  onDelete,
}: {
  service: Service;
  editForm: { name: string; prefix: string; strategy: string };
  setEditForm: (f: any) => void;
  ts: any;
  tc: any;
  t: any;
  error: string | null;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error border border-status-error/15"
        >
          {error}
        </motion.div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-content-secondary">
          {t("serviceName")}
        </label>
        <input
          type="text"
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          required
          className="cyber-input"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-content-secondary">
          {t("servicePrefix")}
        </label>
        <input
          type="text"
          value={editForm.prefix}
          onChange={(e) =>
            setEditForm({ ...editForm, prefix: e.target.value.toUpperCase() })
          }
          required
          maxLength={3}
          className="cyber-input"
        />
        <p className="mt-1 text-xs text-content-tertiary">{ts("prefixHint")}</p>
      </div>
      <CustomSelect
        label={ts("strategy")}
        icon={<GitBranch size={16} />}
        options={[
          { value: "FIFO", label: t("fifo"), description: ts("fifoDesc") },
          {
            value: "PRIORITY",
            label: t("priority"),
            description: ts("priorityDesc"),
          },
        ]}
        value={editForm.strategy}
        onChange={(v) => setEditForm({ ...editForm, strategy: v })}
      />
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          {tc("cancel")}
        </button>
        <button type="submit" disabled={saving} className="btn-cyber flex-1">
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {tc("save")}
        </button>
      </div>
      <div className="rounded-xl border border-status-error/20 bg-status-error/3 p-4">
        <p className="mb-1 text-sm font-semibold text-status-error">
          {ts("dangerZone")}
        </p>
        <p className="mb-3 text-xs text-content-tertiary">{ts("deleteDesc")}</p>
        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="rounded-xl bg-status-error/10 px-4 py-2 text-sm font-semibold text-status-error transition-all hover:bg-status-error/20 hover:shadow-[0_0_16px_rgba(239,68,68,0.1)]"
        >
          {tc("delete")}
        </button>
      </div>
    </form>
  );
}

/* ═══ Detail Row ═══ */
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
    <div className="flex items-center gap-3 bg-surface-secondary/40 px-4 py-3.5 border-b border-accent-primary/5 last:border-b-0">
      <span className="text-accent-primary/60">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-content-tertiary">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-content-primary">
          {value}
        </p>
      </div>
    </div>
  );
}
