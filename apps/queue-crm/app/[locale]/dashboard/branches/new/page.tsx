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
  Sparkles,
  Save,
} from "lucide-react";
import { api } from "../../../../../lib/api";
import { useAuthStore } from "../../../../../lib/store";
import { alert } from "../../../../../lib/alert-store";
import { Link, useRouter } from "../../../../../i18n/navigation";
import { MultiSelect } from "../../../../../components/ui/multi-select";
import { PhoneInput } from "../../../../../components/ui/phone-input";
import {
  YandexMapPicker,
  type MapCoordinates,
} from "../../../../../components/ui/yandex-map-picker";
import {
  branchSchema,
  defaultBranchValues,
  TIMEZONE_OPTIONS,
  AVG_TIME_OPTIONS,
  type BranchFormData,
  type Employee,
} from "../../../../../lib/schemas/branch.schema";

/* ───── Animated Section Wrapper ───── */
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

export default function CreateBranchPage() {
  const t = useTranslations("dashboard");
  const tb = useTranslations("branches");
  const tc = useTranslations("common");
  const tv = useTranslations("branchForm");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid, dirtyFields },
  } = useForm<BranchFormData>({
    resolver: yupResolver(branchSchema),
    defaultValues: defaultBranchValues,
    mode: "onChange",
  });

  const watchName = watch("name");
  const watchAddress = watch("address");

  /* ─── Auto-generate slug from name ─── */
  useEffect(() => {
    if (watchName && !dirtyFields.slug) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  }, [watchName, dirtyFields.slug, setValue]);

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
    fetchEmployees();
  }, [fetchEmployees]);

  const onSubmit = async (data: BranchFormData) => {
    if (!token || !user?.tenantId) return;
    setSaving(true);
    try {
      const payload: any = {
        name: data.name,
        slug: data.slug,
        address: data.address,
        timezone: data.timezone,
        tenantId: user.tenantId,
      };
      if (data.phone && data.phone !== "+998") payload.phone = data.phone;
      if (data.email) payload.email = data.email;
      if (data.workingHours) payload.workingHours = data.workingHours;
      if (data.managerIds && data.managerIds.length > 0) {
        payload.managerIds = data.managerIds;
        payload.managerId = data.managerIds[0];
      }
      if (data.maxDailyTickets && data.maxDailyTickets > 0)
        payload.maxDailyTickets = data.maxDailyTickets;
      if (data.avgTimePerClient && data.avgTimePerClient > 0)
        payload.avgTimePerClient = data.avgTimePerClient;
      if (data.coordinates) payload.coordinates = data.coordinates;

      await api.branches.create(payload, token);
      alert.success(tv("createSuccess"), tv("createSuccessDesc"));
      router.push("/dashboard/branches");
    } catch (err: any) {
      alert.error(tv("createError"), err.message || tv("createErrorDesc"));
    } finally {
      setSaving(false);
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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-content-primary">
            {tv("createTitle")}
          </h1>
          <p className="mt-0.5 text-sm text-content-tertiary">
            {tv("createSubtitle")}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Sparkles size={14} className="text-accent-primary" />
          <span className="text-xs font-medium text-content-tertiary">
            {tv("allFieldsOptionalExceptRequired")}
          </span>
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

        {/* ─── Sticky Action Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="sticky bottom-4 z-30"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-primary/20 bg-surface-elevated/95 px-5 py-3.5 shadow-large backdrop-blur-xl">
            <p className="hidden sm:block text-xs text-content-tertiary">
              {tv("requiredFieldsNote")}
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <Link
                href="/dashboard/branches"
                className="btn-secondary text-sm"
              >
                {tc("cancel")}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-sm"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? tc("loading") : tv("createBranch")}
              </button>
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
