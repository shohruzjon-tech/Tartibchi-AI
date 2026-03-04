"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  Globe,
  Loader2,
  UserPlus,
  Timer,
  Link2,
  Save,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "../../../../../../lib/api";
import { useAuthStore } from "../../../../../../lib/store";
import { alert } from "../../../../../../lib/alert-store";
import { Link, useRouter } from "../../../../../../i18n/navigation";
import { MultiSelect } from "../../../../../../components/ui/multi-select";
import { PhoneInput } from "../../../../../../components/ui/phone-input";
import {
  YandexMapPicker,
  type MapCoordinates,
} from "../../../../../../components/ui/yandex-map-picker";
import {
  branchSchema,
  TIMEZONE_OPTIONS,
  AVG_TIME_OPTIONS,
  type BranchFormData,
  type Employee,
  type Branch,
} from "../../../../../../lib/schemas/branch.schema";

/* ───── Animated Section ───── */
function Section({
  children,
  title,
  icon,
  delay = 0,
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card overflow-hidden"
    >
      <div className="flex items-center gap-3 border-b border-border-primary/10 bg-surface-secondary/30 px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10">
          <span className="text-accent-primary">{icon}</span>
        </div>
        <h3 className="text-sm font-semibold text-content-primary">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </motion.div>
  );
}

/* ───── Field Error ───── */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1 text-xs font-medium text-status-error"
    >
      {message}
    </motion.p>
  );
}

export default function EditBranchPage() {
  const t = useTranslations("dashboard");
  const tb = useTranslations("branches");
  const tc = useTranslations("common");
  const tv = useTranslations("branchForm");
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<BranchFormData>({
    resolver: yupResolver(branchSchema),
    defaultValues: {
      name: "",
      slug: "",
      address: "",
      phone: "+998",
      email: "",
      timezone: "Asia/Tashkent",
      workingHours: "09:00 - 18:00",
      managerIds: [],
      maxDailyTickets: 0,
      avgTimePerClient: 15,
      coordinates: null,
    },
    mode: "onChange",
  });

  const watchAddress = watch("address");

  /* ─── Fetch branch data ─── */
  const fetchBranch = useCallback(async () => {
    if (!token || !branchId) return;
    try {
      const data = await api.branches.get(branchId, token);
      setBranch(data);

      // Extract managerIds
      const mgrIds = (data.managerIds || [])
        .map((m: Employee | string) =>
          typeof m === "object" && m ? m._id : (m as string),
        )
        .filter(Boolean);
      // Fallback to legacy managerId
      if (mgrIds.length === 0 && data.managerId) {
        const legacyId =
          typeof data.managerId === "object" && data.managerId
            ? data.managerId._id
            : (data.managerId as string);
        if (legacyId) mgrIds.push(legacyId);
      }

      reset({
        name: data.name || "",
        slug: data.slug || "",
        address: data.address || "",
        phone: data.phone || "+998",
        email: data.email || "",
        timezone: data.timezone || "Asia/Tashkent",
        workingHours: data.workingHours || "09:00 - 18:00",
        managerIds: mgrIds,
        maxDailyTickets: data.maxDailyTickets || 0,
        avgTimePerClient: data.avgTimePerClient || 15,
        coordinates: data.coordinates || null,
      });
    } catch (err: any) {
      alert.error(tv("fetchError"), err.message);
    } finally {
      setLoading(false);
    }
  }, [token, branchId, reset, tv]);

  const fetchEmployees = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.employees.list({ tenantId: user.tenantId }, token);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId, token]);

  useEffect(() => {
    fetchBranch();
    fetchEmployees();
  }, [fetchBranch, fetchEmployees]);

  const onSubmit = async (data: BranchFormData) => {
    if (!token || !branchId) return;
    setSaving(true);
    try {
      const payload: any = {
        name: data.name,
        slug: data.slug,
        address: data.address,
        timezone: data.timezone,
        phone: data.phone,
        email: data.email,
        workingHours: data.workingHours,
        managerIds: data.managerIds,
        managerId:
          data.managerIds && data.managerIds.length > 0
            ? data.managerIds[0]
            : null,
        maxDailyTickets: data.maxDailyTickets,
        avgTimePerClient: data.avgTimePerClient,
        coordinates: data.coordinates,
      };

      const updated = await api.branches.update(branchId, payload, token);
      setBranch(updated);
      alert.success(tv("updateSuccess"), tv("updateSuccessDesc"));
      router.push("/dashboard/branches");
    } catch (err: any) {
      alert.error(tv("updateError"), err.message || tv("updateErrorDesc"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!token || !branch) return;
    setToggling(true);
    try {
      const updated = await api.branches.update(
        branch._id,
        { isActive: !branch.isActive },
        token,
      );
      setBranch(updated);
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

  /* ─── Resolve validation message ─── */
  const resolveError = (msg?: string) => {
    if (!msg) return undefined;
    if (msg.startsWith("validation.")) {
      return tv(msg as any);
    }
    return msg;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-accent-primary" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="py-20 text-center">
        <Building2 size={32} className="mx-auto text-content-tertiary mb-3" />
        <p className="font-medium text-content-secondary">
          {tv("branchNotFound")}
        </p>
        <Link
          href="/dashboard/branches"
          className="btn-primary mt-4 inline-flex"
        >
          <ArrowLeft size={16} />
          {tv("backToBranches")}
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4"
      >
        <Link
          href="/dashboard/branches"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-content-secondary transition-all hover:bg-surface-tertiary hover:text-content-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-content-primary truncate">
            {tv("editTitle")} — {branch.name}
          </h1>
          <p className="mt-0.5 text-sm text-content-tertiary">
            {tv("editSubtitle")}
          </p>
        </div>
        {/* Status badge */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            branch.isActive
              ? "bg-status-success/10 text-status-success"
              : "bg-surface-tertiary text-content-tertiary"
          }`}
        >
          {branch.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {branch.isActive ? tb("active") : tb("inactive")}
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-3xl">
        {/* ─── Basic Information ─── */}
        <Section
          title={tv("basicInfo")}
          icon={<Building2 size={16} />}
          delay={0.05}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("branchName")} <span className="text-status-error">*</span>
            </label>
            <input
              {...register("name")}
              className="input-field"
              placeholder={tb("namePlaceholder")}
            />
            <FieldError message={resolveError(errors.name?.message)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tb("slug")} <span className="text-status-error">*</span>
            </label>
            <div className="relative">
              <Link2
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary"
              />
              <input
                {...register("slug")}
                className="input-field"
                style={{ paddingLeft: "2.25rem" }}
                placeholder={tb("slugPlaceholder")}
              />
            </div>
            <p className="mt-1 text-xs text-content-tertiary">
              {tb("slugHint")}
            </p>
            <FieldError message={resolveError(errors.slug?.message)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {t("branchAddress")} <span className="text-status-error">*</span>
            </label>
            <input
              {...register("address")}
              className="input-field"
              placeholder={tb("addressPlaceholder")}
            />
            <FieldError message={resolveError(errors.address?.message)} />
          </div>

          {/* Yandex Map */}
          <Controller
            name="coordinates"
            control={control}
            render={({ field }) => (
              <YandexMapPicker
                label={tb("locationOnMap")}
                placeholder={tb("searchLocation")}
                value={field.value}
                address={watchAddress}
                onChange={(coords, addr) => {
                  field.onChange(coords);
                  setValue("address", addr);
                }}
              />
            )}
          />
        </Section>

        {/* ─── Contact Information ─── */}
        <Section
          title={tv("contactInfo")}
          icon={<Phone size={16} />}
          delay={0.1}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {tb("phone")}
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value || "+998"}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {tb("email")}
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary"
                />
                <input
                  {...register("email")}
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: "2.25rem" }}
                  placeholder="branch@company.com"
                />
              </div>
              <FieldError message={resolveError(errors.email?.message)} />
            </div>
          </div>
        </Section>

        {/* ─── Operations ─── */}
        <Section
          title={tv("operations")}
          icon={<Clock size={16} />}
          delay={0.15}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {tb("workingHours")}
              </label>
              <div className="relative">
                <Clock
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary"
                />
                <input
                  {...register("workingHours")}
                  className="input-field"
                  style={{ paddingLeft: "2.25rem" }}
                  placeholder="09:00 - 18:00"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {t("timezone")}
              </label>
              <div className="relative">
                <Globe
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary"
                />
                <select
                  {...register("timezone")}
                  className="input-field appearance-none"
                  style={{ paddingLeft: "2.25rem" }}
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tb("maxDailyTickets")}
            </label>
            <input
              {...register("maxDailyTickets")}
              type="number"
              min="0"
              className="input-field"
              placeholder={tb("unlimitedHint")}
            />
            <FieldError
              message={resolveError(errors.maxDailyTickets?.message)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {tb("avgTimePerClient")}
            </label>
            <Controller
              name="avgTimePerClient"
              control={control}
              render={({ field }) => (
                <div className="flex gap-1.5">
                  {AVG_TIME_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => field.onChange(d)}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                        field.value === d
                          ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                          : "bg-surface-secondary text-content-secondary hover:bg-surface-tertiary"
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              )}
            />
            <p className="mt-1.5 text-xs text-content-tertiary">
              {tb("avgTimePerClientHint")}
            </p>
          </div>
        </Section>

        {/* ─── Team ─── */}
        <Section title={tv("team")} icon={<User size={16} />} delay={0.2}>
          <Controller
            name="managerIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label={tb("managers")}
                placeholder={tb("selectManagers")}
                icon={<User size={15} />}
                value={field.value || []}
                onChange={field.onChange}
                options={employees.map((emp) => ({
                  value: emp._id,
                  label: `${emp.firstName} ${emp.lastName}`,
                  description: emp.role || emp.email || "",
                }))}
                footerAction={{
                  label: tb("createEmployee"),
                  icon: <UserPlus size={14} />,
                  onClick: () => router.push("/dashboard/employees/new"),
                }}
                emptyMessage={tb("noEmployees")}
              />
            )}
          />
        </Section>

        {/* ─── Status & Danger Zone ─── */}
        <Section
          title={tv("statusSection")}
          icon={<CheckCircle2 size={16} />}
          delay={0.25}
        >
          <div className="flex items-center justify-between rounded-xl border border-border-primary/60 p-4">
            <div>
              <p className="text-sm font-semibold text-content-primary">
                {branch.isActive
                  ? tb("deactivateBranch")
                  : tb("activateBranch")}
              </p>
              <p className="mt-0.5 text-xs text-content-tertiary">
                {branch.isActive ? tb("deactivateDesc") : tb("activateDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={toggling}
              className="transition-colors"
            >
              {toggling ? (
                <Loader2
                  size={28}
                  className="animate-spin text-content-tertiary"
                />
              ) : branch.isActive ? (
                <ToggleRight size={32} className="text-status-success" />
              ) : (
                <ToggleLeft size={32} className="text-content-tertiary" />
              )}
            </button>
          </div>

          {/* Timestamps */}
          <div className="rounded-xl bg-surface-secondary/60 p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-content-tertiary">{tb("createdOn")}</span>
              <span className="text-content-secondary font-medium">
                {new Date(branch.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-content-tertiary">{tb("lastUpdated")}</span>
              <span className="text-content-secondary font-medium">
                {new Date(branch.updatedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </Section>

        {/* ─── Sticky Action Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-4 z-30"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-primary/20 bg-surface-elevated/95 px-5 py-3.5 shadow-large backdrop-blur-xl">
            {isDirty && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-medium text-amber-500"
              >
                {tv("unsavedChanges")}
              </motion.p>
            )}
            {!isDirty && (
              <p className="hidden sm:block text-xs text-content-tertiary">
                {tv("noChanges")}
              </p>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <Link
                href="/dashboard/branches"
                className="btn-secondary text-sm"
              >
                {tc("cancel")}
              </Link>
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="btn-primary text-sm"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? tc("loading") : tv("saveChanges")}
              </button>
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
