"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Monitor,
  MapPin,
  Hash,
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Loader2,
  Layers,
  Clock,
  Tag,
  Zap,
  Languages,
  Building2,
  ListChecks,
  UserCheck,
  Phone,
  Key,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  Signal,
} from "lucide-react";
import { Link } from "../../../../i18n/navigation";
import { api } from "../../../../lib/api";
import { useAuthStore } from "../../../../lib/store";
import { Drawer } from "../../../../components/ui/drawer";
import { FilterModal } from "../../../../components/ui/filter-modal";

interface Counter {
  _id: string;
  tenantId: string;
  branchId: string;
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
  employeeId?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  login?: string;
  createdAt: string;
  updatedAt: string;
}

interface Branch {
  _id: string;
  name: string;
  isActive: boolean;
}

interface Queue {
  _id: string;
  name: string;
  branchId: string;
}

export default function CountersPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("counters");
  const tcom = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [counters, setCounters] = useState<Counter[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchCounters = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.counters.list({ tenantId: user.tenantId }, token);
      setCounters(Array.isArray(data) ? data : []);
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
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId, token]);

  const fetchQueues = useCallback(async () => {
    if (!user?.tenantId) return;
    try {
      const data = await api.queues.list({ tenantId: user.tenantId });
      setQueues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    fetchCounters();
    fetchBranches();
    fetchQueues();
  }, [fetchCounters, fetchBranches, fetchQueues]);

  const handleToggleActive = async () => {
    if (!token || !selectedCounter) return;
    setToggling(true);
    try {
      const result = await api.counters.update(
        selectedCounter._id,
        { isActive: !selectedCounter.isActive },
        token,
      );
      const updated = result.counter || result;
      setCounters((prev) =>
        prev.map((c) => (c._id === selectedCounter._id ? updated : c)),
      );
      setSelectedCounter(updated);
    } catch (err: any) {
      setError(err.message || "Failed to update counter status");
    } finally {
      setToggling(false);
    }
  };

  const getBranchName = (branchId: string) =>
    branches.find((b) => b._id === branchId)?.name || branchId;

  const getQueueName = (queueId: string) =>
    queues.find((q) => q._id === queueId)?.name || queueId;

  const filteredCounters = counters.filter((c) => {
    const matchBranch = filterBranchId ? c.branchId === filterBranchId : true;
    const matchStatus =
      filterStatus === "active"
        ? c.isActive
        : filterStatus === "inactive"
          ? !c.isActive
          : true;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q) ||
      (c.location || "").toLowerCase().includes(q) ||
      (c.serviceTypes || []).some((s) => s.toLowerCase().includes(q)) ||
      (c.tags || []).some((t) => t.toLowerCase().includes(q));
    return matchBranch && matchSearch && matchStatus;
  });

  const activeCounters = filteredCounters.filter((c) => c.isActive);
  const inactiveCounters = filteredCounters.filter((c) => !c.isActive);
  const activeFilterCount = [filterBranchId, filterStatus].filter(
    Boolean,
  ).length;

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

  /* Filter modal config */
  const filterGroups = [
    ...(branches.length > 1
      ? [
          {
            key: "branch",
            label: tc("selectBranch"),
            icon: <Building2 size={12} />,
            options: branches.map((b) => ({
              id: b._id,
              label: b.name,
              count: counters.filter((c) => c.branchId === b._id).length,
            })),
          },
        ]
      : []),
    {
      key: "status",
      label: tcom("status") || "Status",
      icon: <Signal size={12} />,
      options: [
        {
          id: "active",
          label: tc("active"),
          count: counters.filter((c) => c.isActive).length,
        },
        {
          id: "inactive",
          label: tc("inactive"),
          count: counters.filter((c) => !c.isActive).length,
        },
      ],
    },
  ];

  const filterValues: Record<string, string | string[]> = {
    branch: filterBranchId,
    status: filterStatus,
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    const v = typeof value === "string" ? value : value[0] || "";
    if (key === "branch") setFilterBranchId(v);
    else if (key === "status") setFilterStatus(v);
  };

  const handleFilterReset = () => {
    setFilterBranchId("");
    setFilterStatus("");
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
            <Monitor size={20} className="text-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              {t("counters")}
            </h1>
            <p className="text-xs text-content-tertiary">{tc("subtitle")}</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link href="/dashboard/counters/new" className="btn-cyber">
            <Plus size={16} />
            {t("createCounter")}
          </Link>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          {
            label: tc("totalCounters"),
            value: counters.length,
            color: "text-content-primary",
            accent: "from-accent-primary/10 to-accent-secondary/5",
            icon: <Monitor size={14} className="text-accent-primary" />,
          },
          {
            label: tc("activeCounters"),
            value: counters.filter((c) => c.isActive).length,
            color: "text-status-success neon-text",
            accent: "from-status-success/10 to-status-success/5",
            icon: <Sparkles size={14} className="text-status-success" />,
          },
          {
            label: tc("inactiveCounters"),
            value: counters.filter((c) => !c.isActive).length,
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
            placeholder={tc("searchPlaceholder")}
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
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="relative">
            <Loader2 size={28} className="animate-spin text-accent-primary" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Loader2 size={28} className="text-accent-primary" />
            </div>
          </div>
          <p className="text-xs text-content-tertiary animate-pulse">
            Loading counters…
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <>
          {activeCounters.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="status-dot-active" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {tc("activeCounters")} ({activeCounters.length})
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-accent-primary/15 to-transparent" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeCounters.map((counter, i) => (
                  <CounterCard
                    key={counter._id}
                    counter={counter}
                    index={i}
                    onClick={() => {
                      setSelectedCounter(counter);
                      setError(null);
                    }}
                    getBranchName={getBranchName}
                    tc={tc}
                  />
                ))}
              </div>
            </div>
          )}

          {inactiveCounters.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="status-dot-inactive" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {tc("inactiveCounters")} ({inactiveCounters.length})
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-content-tertiary/15 to-transparent" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {inactiveCounters.map((counter, i) => (
                  <CounterCard
                    key={counter._id}
                    counter={counter}
                    index={i}
                    onClick={() => {
                      setSelectedCounter(counter);
                      setError(null);
                    }}
                    getBranchName={getBranchName}
                    tc={tc}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredCounters.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/5 animate-neon-pulse">
                <Monitor size={32} className="text-accent-primary/60" />
              </div>
              <p className="font-semibold text-content-secondary">
                {searchQuery || activeFilterCount
                  ? tcom("noResults")
                  : tc("emptyTitle")}
              </p>
              <p className="mt-1.5 text-sm text-content-tertiary">
                {searchQuery || activeFilterCount
                  ? tc("tryDifferentSearch")
                  : tc("emptyDesc")}
              </p>
              {!searchQuery && !activeFilterCount && (
                <Link
                  href="/dashboard/counters/new"
                  className="btn-cyber mt-5 inline-flex"
                >
                  <Plus size={16} />
                  {t("createCounter")}
                </Link>
              )}
            </motion.div>
          )}
        </>
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
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={tc("searchPlaceholder")}
      />

      {/* Counter Detail Drawer */}
      <Drawer
        isOpen={!!selectedCounter}
        onClose={() => {
          setSelectedCounter(null);
          setError(null);
        }}
        title={tc("counterDetails")}
      >
        {selectedCounter && (
          <DrawerContent
            counter={selectedCounter}
            tc={tc}
            tcom={tcom}
            getBranchName={getBranchName}
            getQueueName={getQueueName}
            formatDate={formatDate}
            handleToggleActive={handleToggleActive}
            toggling={toggling}
          />
        )}
      </Drawer>
    </div>
  );
}

/* ═══ Counter Card ═══ */
function CounterCard({
  counter,
  index,
  onClick,
  getBranchName,
  tc,
}: {
  counter: Counter;
  index: number;
  onClick: () => void;
  getBranchName: (id: string) => string;
  tc: any;
}) {
  const locationText =
    (counter.location || "") + (counter.floor ? " · " + counter.floor : "");
  const serviceText =
    counter.serviceTypes && counter.serviceTypes.length > 0
      ? counter.serviceTypes.slice(0, 2).join(", ") +
        (counter.serviceTypes.length > 2
          ? " +" + (counter.serviceTypes.length - 2)
          : "")
      : "";

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
      className={`futuristic-card group w-full cursor-pointer p-5 text-left ${counter.isActive ? "" : "opacity-50"}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${counter.isActive ? "bg-gradient-to-br from-accent-primary/15 to-accent-secondary/10" : "bg-surface-tertiary"}`}
          >
            <Monitor
              size={18}
              className={
                counter.isActive
                  ? "text-accent-primary"
                  : "text-content-tertiary"
              }
            />
            {counter.isActive && (
              <div
                className="absolute -top-0.5 -right-0.5 status-dot-active"
                style={{ width: 8, height: 8 }}
              />
            )}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-content-primary group-hover:text-accent-primary transition-colors">
              {counter.name}
              {counter.counterNumber ? (
                <span className="ml-1.5 text-xs font-normal text-content-tertiary">
                  #{counter.counterNumber}
                </span>
              ) : null}
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-content-tertiary">
              <Building2 size={11} />
              {getBranchName(counter.branchId)}
            </div>
            {counter.employeeId && (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-accent-primary">
                <UserCheck size={11} />
                {counter.employeeId.firstName} {counter.employeeId.lastName}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={"/staff/counter/" + counter._id}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-1.5 text-content-tertiary transition-colors hover:bg-accent-primary/10 hover:text-accent-primary"
            title={tc("openScreen")}
          >
            <ExternalLink size={14} />
          </Link>
          <ChevronRight
            size={16}
            className="text-content-tertiary transition-all group-hover:translate-x-1 group-hover:text-accent-primary"
          />
        </div>
      </div>

      {/* Info chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {counter.location && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary/80 px-2 py-1 text-[11px] font-medium text-content-secondary">
            <MapPin size={10} />
            {locationText}
          </span>
        )}
        {serviceText && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary/80 px-2 py-1 text-[11px] font-medium text-content-secondary">
            <Layers size={10} />
            {serviceText}
          </span>
        )}
        {counter.languages && counter.languages.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary/80 px-2 py-1 text-[11px] font-medium text-content-secondary">
            <Globe size={10} />
            {counter.languages.join(", ")}
          </span>
        )}
        {(counter.avgServiceTime ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary/80 px-2 py-1 text-[11px] font-medium text-content-secondary">
            <Clock size={10} />
            {counter.avgServiceTime}m
          </span>
        )}
        {counter.queueIds.length > 0 && (
          <span className="holo-badge inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-accent-primary">
            <Hash size={10} />
            {counter.queueIds.length}{" "}
            {counter.queueIds.length !== 1 ? "queues" : "queue"}
          </span>
        )}
      </div>

      {/* Tags */}
      {counter.tags && counter.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {counter.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="rounded-md bg-accent-primary/6 px-2 py-0.5 text-[10px] font-medium text-accent-primary"
            >
              {tag}
            </span>
          ))}
          {counter.tags.length > 3 && (
            <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-content-tertiary">
              +{counter.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}

/* ═══ Drawer Content ═══ */
function DrawerContent({
  counter,
  tc,
  tcom,
  getBranchName,
  getQueueName,
  formatDate,
  handleToggleActive,
  toggling,
}: {
  counter: Counter;
  tc: any;
  tcom: any;
  getBranchName: (id: string) => string;
  getQueueName: (id: string) => string;
  formatDate: (d: string) => string;
  handleToggleActive: () => void;
  toggling: boolean;
}) {
  const editHref = "/dashboard/counters/" + counter._id + "/edit";
  const counterTitle =
    counter.name + (counter.counterNumber ? " #" + counter.counterNumber : "");
  const locationValue =
    (counter.location || "") + (counter.floor ? " · " + counter.floor : "");

  return (
    <div className="space-y-6">
      {/* Status & Edit */}
      <div className="flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold ${counter.isActive ? "bg-status-success/10 text-status-success border border-status-success/20" : "bg-surface-tertiary text-content-tertiary"}`}
        >
          {counter.isActive ? (
            <span
              className="status-dot-active"
              style={{ width: 8, height: 8 }}
            />
          ) : (
            <XCircle size={12} />
          )}
          {counter.isActive ? tc("active") : tc("inactive")}
        </div>
        <Link
          href={editHref}
          className="btn-ghost flex items-center gap-1.5 text-sm"
        >
          <Pencil size={14} />
          {tcom("edit")}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 shadow-[0_0_24px_rgba(52,211,153,0.1)]">
          <Monitor size={24} className="text-accent-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">
            {counterTitle}
          </h3>
          <p className="text-xs text-content-tertiary">
            {tc("createdOn")} {formatDate(counter.createdAt)}
          </p>
        </div>
      </div>

      {/* Description */}
      {counter.description && (
        <div className="futuristic-card p-4">
          <p className="text-sm text-content-secondary">
            {counter.description}
          </p>
        </div>
      )}

      {/* Details */}
      <div className="space-y-1 overflow-hidden rounded-2xl">
        <DetailRow
          icon={<Building2 size={15} />}
          label={tc("selectBranch")}
          value={getBranchName(counter.branchId)}
        />
        {counter.location && (
          <DetailRow
            icon={<MapPin size={15} />}
            label={tc("location")}
            value={locationValue}
          />
        )}
        {counter.serviceTypes && counter.serviceTypes.length > 0 && (
          <DetailRow
            icon={<Layers size={15} />}
            label={tc("serviceTypes")}
            value={counter.serviceTypes.join(", ")}
          />
        )}
        {counter.languages && counter.languages.length > 0 && (
          <DetailRow
            icon={<Languages size={15} />}
            label={tc("languages")}
            value={counter.languages.join(", ")}
          />
        )}
        {(counter.avgServiceTime ?? 0) > 0 && (
          <DetailRow
            icon={<Clock size={15} />}
            label={tc("avgServiceTime")}
            value={counter.avgServiceTime + " min"}
          />
        )}
        <DetailRow
          icon={<Zap size={15} />}
          label={tc("priority")}
          value={String(counter.priority ?? 0)}
        />
        <DetailRow
          icon={<ListChecks size={15} />}
          label={tc("maxConcurrentTickets")}
          value={String(counter.maxConcurrentTickets ?? 1)}
        />
      </div>

      {/* Assigned Employee */}
      {counter.employeeId && (
        <div className="futuristic-card p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-content-tertiary">
            <UserCheck size={12} />
            {tc("assignedEmployee")}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary text-sm font-bold text-white shadow-[0_0_12px_rgba(52,211,153,0.2)]">
              {counter.employeeId.firstName?.[0]}
              {counter.employeeId.lastName?.[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-content-primary">
                {counter.employeeId.firstName} {counter.employeeId.lastName}
              </p>
              <div className="flex items-center gap-2 text-xs text-content-tertiary">
                {counter.employeeId.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={10} />
                    {counter.employeeId.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          {counter.login && (
            <div className="mt-2 flex items-center gap-2 text-xs text-content-secondary">
              <Key size={10} />
              <span className="font-medium">{tc("loginLabel")}:</span>
              <span className="font-mono holo-badge rounded-md px-1.5 py-0.5">
                {counter.login}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {counter.tags && counter.tags.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-content-tertiary">
            {tc("tags")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {counter.tags.map((tag, i) => (
              <span
                key={i}
                className="holo-badge inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-accent-primary"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Queues */}
      {counter.queueIds.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-content-tertiary">
            {tc("queuesAssigned")} ({counter.queueIds.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {counter.queueIds.map((qId) => (
              <span
                key={qId}
                className="rounded-lg bg-surface-secondary/80 px-2.5 py-1 text-xs font-medium text-content-secondary border border-accent-primary/5"
              >
                {getQueueName(qId)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="cyber-stat p-4">
        <div className="flex justify-between text-xs">
          <span className="text-content-tertiary">{tc("lastUpdated")}</span>
          <span className="font-medium text-content-secondary">
            {formatDate(counter.updatedAt)}
          </span>
        </div>
      </div>

      {/* Toggle */}
      <div className="futuristic-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-content-primary">
              {counter.isActive
                ? tc("deactivateCounter")
                : tc("activateCounter")}
            </p>
            <p className="mt-0.5 text-xs text-content-tertiary">
              {counter.isActive ? tc("deactivateDesc") : tc("activateDesc")}
            </p>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={toggling}
            className="transition-colors"
          >
            {toggling ? (
              <Loader2
                size={28}
                className="animate-spin text-content-tertiary"
              />
            ) : counter.isActive ? (
              <ToggleRight size={32} className="text-status-success" />
            ) : (
              <ToggleLeft size={32} className="text-content-tertiary" />
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={editHref} className="btn-secondary flex-1 justify-center">
          <Pencil size={16} />
          {tc("editCounter")}
        </Link>
        <Link
          href={"/staff/counter/" + counter._id}
          target="_blank"
          className="btn-cyber flex-1 justify-center"
        >
          <ExternalLink size={16} />
          {tc("openScreen")}
        </Link>
      </div>
    </div>
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
