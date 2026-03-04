"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  Ticket,
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Loader2,
  Monitor,
  ExternalLink,
  Link2,
  Timer,
} from "lucide-react";
import { api } from "../../../../lib/api";
import { alert } from "../../../../lib/alert-store";
import { Link, useRouter } from "../../../../i18n/navigation";
import { useAuthStore } from "../../../../lib/store";
import { Drawer } from "../../../../components/ui/drawer";
import type { Employee, Branch } from "../../../../lib/schemas/branch.schema";

export default function BranchesPage() {
  const t = useTranslations("dashboard");
  const tb = useTranslations("branches");
  const tc = useTranslations("common");
  const tv = useTranslations("branchForm");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toggling, setToggling] = useState(false);

  /* Schedule drawer */
  const DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const [scheduleBranch, setScheduleBranch] = useState<Branch | null>(null);
  const [branchSchedule, setBranchSchedule] = useState<
    Record<string, { start: string; end: string; closed: boolean }>
  >({});
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const to = useTranslations("onboarding");

  const fetchBranches = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.branches.list(user.tenantId, token);
      setBranches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      alert.error(tv("fetchError"), err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, token, tv]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleToggleActive = async () => {
    if (!token || !selectedBranch) return;
    setToggling(true);
    try {
      const updated = await api.branches.update(
        selectedBranch._id,
        { isActive: !selectedBranch.isActive },
        token,
      );
      setBranches((prev) =>
        prev.map((b) => (b._id === selectedBranch._id ? updated : b)),
      );
      setSelectedBranch(updated);
      if (updated.isActive) {
        alert.success(tv("branchActivated"));
      } else {
        alert.warning(tv("branchDeactivated"));
      }
    } catch (err: any) {
      alert.error(tv("toggleError"), err.message);
    } finally {
      setToggling(false);
    }
  };

  const openScheduleDrawer = (branch: Branch, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const defaults: Record<
      string,
      { start: string; end: string; closed: boolean }
    > = {};
    DAYS.forEach((d) => {
      defaults[d] = { start: "09:00", end: "18:00", closed: d === "sunday" };
    });
    const existing = branch.schedule || {};
    DAYS.forEach((d) => {
      if (existing[d]) {
        defaults[d] = {
          start: existing[d].start || "09:00",
          end: existing[d].end || "18:00",
          closed: existing[d].closed || false,
        };
      }
    });
    setBranchSchedule(defaults);
    setScheduleBranch(branch);
    setScheduleSaved(false);
  };

  const saveSchedule = async () => {
    if (!token || !scheduleBranch) return;
    setScheduleSaving(true);
    try {
      const openDays = DAYS.filter((d) => !branchSchedule[d].closed);
      const summaryHours =
        openDays.length > 0
          ? `${branchSchedule[openDays[0]].start} - ${branchSchedule[openDays[0]].end}`
          : "Closed";

      const updated = await api.branches.update(
        scheduleBranch._id,
        { schedule: branchSchedule, workingHours: summaryHours },
        token,
      );
      setBranches((prev) =>
        prev.map((b) => (b._id === scheduleBranch._id ? updated : b)),
      );
      setScheduleBranch(updated);
      setScheduleSaved(true);
      alert.success(tb("scheduleSaved"));
      setTimeout(() => setScheduleSaved(false), 3000);
    } catch (err: any) {
      alert.error(tv("scheduleError"), err.message);
    } finally {
      setScheduleSaving(false);
    }
  };

  const openBranchDrawer = (branch: Branch) => {
    setSelectedBranch(branch);
  };

  const getManagerDisplayNames = (branch: Branch): string[] => {
    const names: string[] = [];
    if (branch.managerIds?.length) {
      for (const m of branch.managerIds) {
        if (typeof m === "object" && m) {
          names.push(
            `${(m as Employee).firstName} ${(m as Employee).lastName}`,
          );
        }
      }
    }
    if (names.length === 0) {
      if (typeof branch.managerId === "object" && branch.managerId) {
        names.push(
          `${(branch.managerId as Employee).firstName} ${(branch.managerId as Employee).lastName}`,
        );
      } else if (branch.managerName) {
        names.push(branch.managerName);
      }
    }
    return names;
  };

  const getManagerDisplayName = (branch: Branch) => {
    return getManagerDisplayNames(branch).join(", ");
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getManagerDisplayName(b)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const activeBranches = filteredBranches.filter((b) => b.isActive);
  const inactiveBranches = filteredBranches.filter((b) => !b.isActive);

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

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {t("branches")}
          </h1>
          <p className="mt-1 text-sm text-content-tertiary">{tb("subtitle")}</p>
        </div>
        <Link href="/dashboard/branches/new" className="btn-primary">
          <Plus size={16} />
          {t("createBranch")}
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="card px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="text-[10px] sm:text-xs font-medium text-content-tertiary uppercase tracking-wide">
            {tb("totalBranches")}
          </div>
          <div className="mt-0.5 text-lg sm:text-xl font-bold text-content-primary">
            {branches.length}
          </div>
        </div>
        <div className="card px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="text-[10px] sm:text-xs font-medium text-content-tertiary uppercase tracking-wide">
            {tb("activeBranches")}
          </div>
          <div className="mt-0.5 text-lg sm:text-xl font-bold text-status-success">
            {branches.filter((b) => b.isActive).length}
          </div>
        </div>
        <div className="card px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="text-[10px] sm:text-xs font-medium text-content-tertiary uppercase tracking-wide">
            {tb("inactiveBranches")}
          </div>
          <div className="mt-0.5 text-lg sm:text-xl font-bold text-content-tertiary">
            {branches.filter((b) => !b.isActive).length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-xs">
        <div className="relative flex items-center">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 text-content-tertiary"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tb("searchPlaceholder")}
            className="input-field h-9 text-sm"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
        </div>
      )}

      {/* Branch Grid */}
      {!loading && (
        <>
          {activeBranches.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {tb("activeBranches")} ({activeBranches.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeBranches.map((branch, i) => (
                  <BranchCard
                    key={branch._id}
                    branch={branch}
                    index={i}
                    onClick={() => openBranchDrawer(branch)}
                    onScheduleClick={(e) => openScheduleDrawer(branch, e)}
                    tb={tb}
                  />
                ))}
              </div>
            </div>
          )}

          {inactiveBranches.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {tb("inactiveBranches")} ({inactiveBranches.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                {inactiveBranches.map((branch, i) => (
                  <BranchCard
                    key={branch._id}
                    branch={branch}
                    index={i}
                    onClick={() => openBranchDrawer(branch)}
                    onScheduleClick={(e) => openScheduleDrawer(branch, e)}
                    tb={tb}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredBranches.length === 0 && (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-secondary">
                <Building2 size={28} className="text-content-tertiary" />
              </div>
              <p className="text-content-secondary font-medium">
                {searchQuery ? tc("noResults") : tb("emptyTitle")}
              </p>
              <p className="mt-1 text-sm text-content-tertiary">
                {searchQuery ? tb("tryDifferentSearch") : tb("emptyDesc")}
              </p>
              {!searchQuery && (
                <Link
                  href="/dashboard/branches/new"
                  className="btn-primary mt-4 inline-flex"
                >
                  <Plus size={16} />
                  {t("createBranch")}
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* Branch Detail Drawer (view only) */}
      <Drawer
        isOpen={!!selectedBranch}
        onClose={() => setSelectedBranch(null)}
        title={tb("branchDetails")}
      >
        {selectedBranch && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedBranch.isActive
                    ? "bg-status-success/10 text-status-success"
                    : "bg-surface-tertiary text-content-tertiary"
                }`}
              >
                {selectedBranch.isActive ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <XCircle size={12} />
                )}
                {selectedBranch.isActive ? tb("active") : tb("inactive")}
              </div>
              <Link
                href={`/dashboard/branches/${selectedBranch._id}/edit`}
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                <Pencil size={14} />
                {tc("edit")}
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-primary/8">
                <Building2 size={20} className="text-accent-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-primary">
                  {selectedBranch.name}
                </h3>
                <p className="text-xs text-content-tertiary">
                  {tb("createdOn")} {formatDate(selectedBranch.createdAt)}
                </p>
              </div>
            </div>

            <div className="space-y-0.5 rounded-xl bg-surface-secondary/60 overflow-hidden">
              {selectedBranch.slug && (
                <DetailRow
                  icon={<Link2 size={15} />}
                  label={tb("slug")}
                  value={`/queue/${selectedBranch.slug}`}
                />
              )}
              <DetailRow
                icon={<MapPin size={15} />}
                label={t("branchAddress")}
                value={selectedBranch.address}
              />
              {selectedBranch.phone && (
                <DetailRow
                  icon={<Phone size={15} />}
                  label={tb("phone")}
                  value={selectedBranch.phone}
                />
              )}
              {selectedBranch.email && (
                <DetailRow
                  icon={<Mail size={15} />}
                  label={tb("email")}
                  value={selectedBranch.email}
                />
              )}
              <DetailRow
                icon={<Globe size={15} />}
                label={t("timezone")}
                value={selectedBranch.timezone}
              />
              {selectedBranch.workingHours && (
                <DetailRow
                  icon={<Clock size={15} />}
                  label={tb("workingHours")}
                  value={selectedBranch.workingHours}
                />
              )}
              {getManagerDisplayNames(selectedBranch).length > 0 && (
                <DetailRow
                  icon={<User size={15} />}
                  label={tb("managers")}
                  value={getManagerDisplayName(selectedBranch)}
                />
              )}
              <DetailRow
                icon={<Ticket size={15} />}
                label={tb("maxDailyTickets")}
                value={
                  selectedBranch.maxDailyTickets
                    ? String(selectedBranch.maxDailyTickets)
                    : tb("unlimited")
                }
              />
              <DetailRow
                icon={<Timer size={15} />}
                label={tb("avgTimePerClient")}
                value={
                  selectedBranch.avgTimePerClient
                    ? `${selectedBranch.avgTimePerClient} min`
                    : "15 min"
                }
              />
            </div>

            <div className="rounded-xl bg-surface-secondary/60 p-4">
              <div className="flex justify-between text-xs">
                <span className="text-content-tertiary">
                  {tb("lastUpdated")}
                </span>
                <span className="text-content-secondary font-medium">
                  {formatDate(selectedBranch.updatedAt)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-content-primary">
                    {selectedBranch.isActive
                      ? tb("deactivateBranch")
                      : tb("activateBranch")}
                  </p>
                  <p className="mt-0.5 text-xs text-content-tertiary">
                    {selectedBranch.isActive
                      ? tb("deactivateDesc")
                      : tb("activateDesc")}
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
                  ) : selectedBranch.isActive ? (
                    <ToggleRight size={32} className="text-status-success" />
                  ) : (
                    <ToggleLeft size={32} className="text-content-tertiary" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Schedule Drawer */}
      <Drawer
        isOpen={!!scheduleBranch}
        onClose={() => {
          setScheduleBranch(null);
          setScheduleSaved(false);
        }}
        title={tb("scheduleTitle")}
      >
        {scheduleBranch && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/8">
                <Clock size={18} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-content-primary">
                  {scheduleBranch.name}
                </h3>
                <p className="text-xs text-content-tertiary">
                  {tb("scheduleDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl bg-surface-secondary/40 p-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setBranchSchedule((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], closed: !prev[day].closed },
                      }))
                    }
                    className={`w-16 shrink-0 rounded-md px-1.5 py-1.5 text-[10px] font-semibold transition-colors ${
                      branchSchedule[day]?.closed
                        ? "bg-surface-tertiary text-content-tertiary line-through"
                        : "bg-blue-500/10 text-blue-600"
                    }`}
                  >
                    {to(`day_${day}`)}
                  </button>
                  {!branchSchedule[day]?.closed ? (
                    <>
                      <input
                        type="time"
                        value={branchSchedule[day]?.start || "09:00"}
                        onChange={(e) =>
                          setBranchSchedule((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], start: e.target.value },
                          }))
                        }
                        className="input-field h-8 w-24 text-[11px]"
                      />
                      <span className="text-content-tertiary">–</span>
                      <input
                        type="time"
                        value={branchSchedule[day]?.end || "18:00"}
                        onChange={(e) =>
                          setBranchSchedule((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], end: e.target.value },
                          }))
                        }
                        className="input-field h-8 w-24 text-[11px]"
                      />
                    </>
                  ) : (
                    <span className="text-[11px] text-content-tertiary italic">
                      {to("closed")}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={saveSchedule}
                disabled={scheduleSaving}
                className="btn-primary text-xs"
              >
                {scheduleSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {tc("save")}
              </button>
              <AnimatePresence>
                {scheduleSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex items-center gap-1 text-xs font-medium text-status-success"
                  >
                    <CheckCircle2 size={13} />
                    {tb("scheduleSaved")}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ───── Branch Card Component ───── */
function BranchCard({
  branch,
  index,
  onClick,
  onScheduleClick,
  tb,
}: {
  branch: Branch;
  index: number;
  onClick: () => void;
  onScheduleClick?: (e: React.MouseEvent) => void;
  tb: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`card group w-full overflow-hidden transition-all ${
        !branch.isActive ? "opacity-60" : ""
      }`}
    >
      <button
        onClick={onClick}
        className="w-full cursor-pointer p-4 sm:p-5 text-left"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                branch.isActive ? "bg-accent-primary/8" : "bg-surface-tertiary"
              }`}
            >
              <Building2
                size={18}
                className={
                  branch.isActive
                    ? "text-accent-primary"
                    : "text-content-tertiary"
                }
              />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-content-primary">
                {branch.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-content-tertiary truncate">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{branch.address}</span>
              </div>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="mt-1 shrink-0 text-content-tertiary transition-transform group-hover:translate-x-0.5"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {branch.workingHours && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-content-secondary">
              <Clock size={9} />
              {branch.workingHours}
            </span>
          )}
          {branch.avgTimePerClient && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/8 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              <Timer size={9} />
              {branch.avgTimePerClient}m
            </span>
          )}
          {(() => {
            const managers: string[] = [];
            if (branch.managerIds && Array.isArray(branch.managerIds)) {
              branch.managerIds.forEach((m) => {
                if (typeof m === "object" && m && "firstName" in m)
                  managers.push(
                    `${(m as Employee).firstName} ${(m as Employee).lastName}`,
                  );
              });
            }
            if (
              managers.length === 0 &&
              typeof branch.managerId === "object" &&
              branch.managerId
            ) {
              managers.push(
                `${(branch.managerId as Employee).firstName} ${(branch.managerId as Employee).lastName}`,
              );
            }
            if (managers.length === 0 && branch.managerName) {
              managers.push(branch.managerName);
            }
            return managers.length > 0 ? (
              <>
                {managers.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-content-secondary"
                  >
                    <User size={9} />
                    {name}
                  </span>
                ))}
              </>
            ) : null;
          })()}
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-content-secondary">
            <Globe size={9} />
            {branch.timezone.split("/").pop()}
          </span>
        </div>
      </button>

      <div className="flex items-center gap-1.5 border-t border-border-primary/10 px-4 py-2.5 sm:px-5">
        <button
          onClick={(e) => onScheduleClick?.(e)}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-500/8 px-2 py-1 text-[10px] font-semibold text-blue-600 transition-colors hover:bg-blue-500/15"
        >
          <Clock size={10} />
          {tb("schedule")}
        </button>
        <Link
          href={`/display/${branch.slug}`}
          target="_blank"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-lg bg-accent-primary/8 px-2 py-1 text-[10px] font-semibold text-accent-primary transition-colors hover:bg-accent-primary/15"
        >
          <Monitor size={10} />
          {tb("openDisplay")}
          <ExternalLink size={8} className="opacity-60" />
        </Link>
        {branch.slug && (
          <Link
            href={`/queue/${branch.slug}`}
            target="_blank"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-lg bg-accent-secondary/8 px-2 py-1 text-[10px] font-semibold text-accent-secondary transition-colors hover:bg-accent-secondary/15"
          >
            <Ticket size={10} />
            {tb("openTicketing")}
            <ExternalLink size={8} className="opacity-60" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

/* ───── Detail Row ───── */
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
