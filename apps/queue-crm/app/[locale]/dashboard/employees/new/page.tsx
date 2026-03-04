"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Upload,
  FileText,
  FileCheck,
  CreditCard,
  Award,
  Paperclip,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileImage,
  ShieldCheck,
  UserCog,
  UserCheck,
} from "lucide-react";
import { api } from "../../../../../lib/api";
import { useAuthStore } from "../../../../../lib/store";
import { CustomSelect } from "../../../../../components/ui/custom-select";
import { PhoneInput } from "../../../../../components/ui/phone-input";
import { Link, useRouter } from "../../../../../i18n/navigation";

/* ───── Types ───── */
interface StagedFile {
  id: string;
  file: File;
  category: string;
}

interface Branch {
  _id: string;
  name: string;
  isActive: boolean;
}

/* ───── Constants ───── */
const ROLES = ["STAFF", "BRANCH_MANAGER", "TENANT_ADMIN"] as const;
const DOC_CATEGORIES = [
  "contract",
  "id_document",
  "certificate",
  "resume",
  "other",
] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt";

/* ───── Helpers ───── */
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileTypeIcon = (type: string) => {
  if (type === "application/pdf")
    return { Icon: FileText, color: "text-red-500", bg: "bg-red-500/8" };
  if (type.includes("word") || type.includes("document"))
    return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-500/8" };
  if (type.includes("sheet") || type.includes("excel"))
    return {
      Icon: FileSpreadsheet,
      color: "text-emerald-500",
      bg: "bg-emerald-500/8",
    };
  if (type.startsWith("image/"))
    return {
      Icon: FileImage,
      color: "text-purple-500",
      bg: "bg-purple-500/8",
    };
  return {
    Icon: Paperclip,
    color: "text-content-tertiary",
    bg: "bg-surface-secondary",
  };
};

const guessCategory = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("contract") || lower.includes("agreement"))
    return "contract";
  if (
    lower.includes("passport") ||
    lower.includes("id") ||
    lower.includes("license")
  )
    return "id_document";
  if (lower.includes("cert") || lower.includes("diploma")) return "certificate";
  if (lower.includes("resume") || lower.includes("cv")) return "resume";
  return "other";
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.08,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

/* ═══════════════════════════════════════════════════════
   New Employee Page
   ═══════════════════════════════════════════════════════ */
export default function NewEmployeePage() {
  const te = useTranslations("employees");
  const tc = useTranslations("common");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── State ─── */
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "+998",
    email: "",
    role: "STAFF" as string,
    branchId: "",
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  /* ─── Fetch branches ─── */
  const fetchBranches = useCallback(async () => {
    if (!user?.tenantId || !token) return;
    try {
      const data = await api.branches.list(user.tenantId, token);
      const list = Array.isArray(data) ? data : [];
      setBranches(list);
      if (list.length > 0) {
        setForm((prev) => ({ ...prev, branchId: list[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.tenantId, token]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  /* ─── Role config ─── */
  const getRoleConfig = (role: string) => {
    switch (role) {
      case "TENANT_ADMIN":
        return {
          label: te("roleTenantAdmin"),
          color: "text-accent-primary",
          bg: "bg-accent-primary/8",
          icon: ShieldCheck,
          desc: te("roleTenantAdminDesc"),
        };
      case "BRANCH_MANAGER":
        return {
          label: te("roleBranchManager"),
          color: "text-status-warning",
          bg: "bg-status-warning/8",
          icon: UserCog,
          desc: te("roleBranchManagerDesc"),
        };
      default:
        return {
          label: te("roleStaff"),
          color: "text-status-info",
          bg: "bg-status-info/8",
          icon: UserCheck,
          desc: te("roleStaffDesc"),
        };
    }
  };

  /* ─── Category config ─── */
  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case "contract":
        return {
          label: te("catContract"),
          icon: FileCheck,
          color: "text-accent-primary",
          bg: "bg-accent-primary/8",
        };
      case "id_document":
        return {
          label: te("catIdDocument"),
          icon: CreditCard,
          color: "text-status-warning",
          bg: "bg-status-warning/8",
        };
      case "certificate":
        return {
          label: te("catCertificate"),
          icon: Award,
          color: "text-status-success",
          bg: "bg-status-success/8",
        };
      case "resume":
        return {
          label: te("catResume"),
          icon: FileText,
          color: "text-status-info",
          bg: "bg-status-info/8",
        };
      default:
        return {
          label: te("catOther"),
          icon: Paperclip,
          color: "text-content-secondary",
          bg: "bg-surface-secondary",
        };
    }
  };

  /* ─── File handling ─── */
  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const oversized = arr.filter((f) => f.size > MAX_FILE_SIZE);
    const valid = arr.filter((f) => f.size <= MAX_FILE_SIZE);

    if (oversized.length > 0) {
      setError(te("fileTooLarge"));
      setTimeout(() => setError(null), 4000);
    }

    const newFiles: StagedFile[] = valid.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      category: guessCategory(file.name),
    }));
    setStagedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) =>
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));

  const updateCategory = (id: string, category: string) =>
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, category } : f)),
    );

  /* ─── Drag & Drop ─── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setUploadStatus("");

    try {
      // Step 1: Create the employee
      const employee = await api.employees.create(
        { ...form, tenantId: user?.tenantId },
        token,
      );

      // Step 2: Upload each staged document
      if (stagedFiles.length > 0) {
        for (let i = 0; i < stagedFiles.length; i++) {
          const sf = stagedFiles[i];
          setUploadStatus(
            `${te("uploadingDocs")} (${i + 1}/${stagedFiles.length})`,
          );
          await api.documents.upload(employee._id, sf.file, sf.category, token);
        }
      }

      // Navigate back to employees list
      router.push("/dashboard/employees");
    } catch (err: any) {
      setError(err.message || "Failed to create employee");
      setSaving(false);
      setUploadStatus("");
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ═══════════════════════════════════════════
     Render
     ═══════════════════════════════════════════ */
  return (
    <div className="mx-auto max-w-3xl pb-8">
      {/* ── Back + Title ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <Link
          href="/dashboard/employees"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-content-secondary transition-colors hover:text-accent-primary"
        >
          <ArrowLeft size={16} />
          {te("backToEmployees")}
        </Link>
        <h1 className="text-2xl font-bold text-content-primary">
          {te("createTitle")}
        </h1>
        <p className="mt-1 text-sm text-content-tertiary">
          {te("createSubtitle")}
        </p>
      </motion.div>

      {/* ── Error Banner ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex items-center gap-3 rounded-xl bg-status-error/8 px-4 py-3"
        >
          <AlertCircle size={18} className="shrink-0 text-status-error" />
          <p className="text-sm font-medium text-status-error">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto shrink-0 text-status-error/60 hover:text-status-error"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ═══════════════════════════════════════
           Section 1 — Personal Information
           ═══════════════════════════════════════ */}
        <motion.section
          custom={0}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="card mb-5 p-5 sm:p-6"
        >
          <SectionHeader
            icon={<User size={16} className="text-accent-primary" />}
            iconBg="bg-accent-primary/8"
            title={te("personalInfo")}
            description={te("personalInfoDesc")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {te("firstName")} <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                required
                className="input-field"
                placeholder={te("firstNamePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-secondary">
                {te("lastName")} <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                required
                className="input-field"
                placeholder={te("lastNamePlaceholder")}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {te("phone")} <span className="text-status-error">*</span>
            </label>
            <PhoneInput
              value={form.phone}
              onChange={(v) => updateField("phone", v)}
            />
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════
           Section 2 — Account Credentials
           ═══════════════════════════════════════ */}
        <motion.section
          custom={1}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="card mb-5 p-5 sm:p-6"
        >
          <SectionHeader
            icon={<Mail size={16} className="text-status-info" />}
            iconBg="bg-status-info/8"
            title={te("accountCredentials")}
            description={te("accountCredentialsDesc")}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-secondary">
              {te("email")}
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="input-field pl-9"
                placeholder={te("emailPlaceholder")}
              />
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════
           Section 3 — Role & Assignment
           ═══════════════════════════════════════ */}
        <motion.section
          custom={2}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="card mb-5 p-5 sm:p-6"
        >
          <SectionHeader
            icon={<Shield size={16} className="text-status-warning" />}
            iconBg="bg-status-warning/8"
            title={te("roleAssignment")}
            description={te("roleAssignmentDesc")}
          />

          <div className="space-y-4">
            <CustomSelect
              label={te("role")}
              icon={<Shield size={16} />}
              options={ROLES.map((role) => {
                const rc = getRoleConfig(role);
                return {
                  value: role,
                  label: rc.label,
                  description: rc.desc,
                };
              })}
              value={form.role}
              onChange={(v) => updateField("role", v)}
            />

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
              value={form.branchId}
              onChange={(v) => updateField("branchId", v)}
            />
          </div>

          {/* Role preview card */}
          {form.role && (
            <div className="mt-4 rounded-xl bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 p-3.5">
              <div className="flex items-start gap-2.5">
                {(() => {
                  const rc = getRoleConfig(form.role);
                  const RoleIcon = rc.icon;
                  return (
                    <>
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${rc.bg}`}
                      >
                        <RoleIcon size={14} className={rc.color} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${rc.color}`}>
                          {rc.label}
                        </p>
                        <p className="mt-0.5 text-xs text-content-tertiary">
                          {rc.desc}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </motion.section>

        {/* ═══════════════════════════════════════
           Section 4 — Documents & Attachments
           ═══════════════════════════════════════ */}
        <motion.section
          custom={3}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="card mb-5 p-5 sm:p-6"
        >
          <SectionHeader
            icon={<FileText size={16} className="text-status-success" />}
            iconBg="bg-status-success/8"
            title={te("documents")}
            description={te("documentsDesc")}
          />

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
              isDragOver
                ? "border-accent-primary bg-accent-primary/5 shadow-glow"
                : "border-border-primary bg-surface-secondary/30 hover:border-accent-primary/40 hover:bg-surface-secondary/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_EXTENSIONS}
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <div
              className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                isDragOver ? "bg-accent-primary/10" : "bg-surface-tertiary"
              }`}
            >
              <Upload
                size={22}
                className={`transition-colors ${
                  isDragOver ? "text-accent-primary" : "text-content-tertiary"
                }`}
              />
            </div>
            <p className="text-sm font-medium text-content-secondary">
              {te("dropzoneTitle")}
            </p>
            <p className="mt-1 text-xs text-content-tertiary">
              {te("dropzoneHint")}
            </p>
          </div>

          {/* Staged file list */}
          {stagedFiles.length > 0 && (
            <div className="mt-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {te("stagedFiles")} ({stagedFiles.length})
              </p>
              {stagedFiles.map((sf, index) => {
                const ft = getFileTypeIcon(sf.file.type);
                const FileIcon = ft.Icon;
                return (
                  <motion.div
                    key={sf.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center gap-3 rounded-xl bg-surface-secondary/60 p-3"
                  >
                    {/* File type icon */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ft.bg}`}
                    >
                      <FileIcon size={16} className={ft.color} />
                    </div>

                    {/* Name + size */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content-primary">
                        {sf.file.name}
                      </p>
                      <p className="text-xs text-content-tertiary">
                        {formatFileSize(sf.file.size)}
                      </p>
                    </div>

                    {/* Category selector */}
                    <select
                      value={sf.category}
                      onChange={(e) => updateCategory(sf.id, e.target.value)}
                      className="h-8 rounded-lg border border-border-primary bg-surface-primary px-2 text-xs font-medium text-content-secondary transition-colors focus:border-accent-primary focus:outline-none"
                    >
                      {DOC_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {getCategoryConfig(cat).label}
                        </option>
                      ))}
                    </select>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFile(sf.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-status-error/8 hover:text-status-error"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* ═══════════════════════════════════════
           Actions
           ═══════════════════════════════════════ */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="flex items-center justify-between"
        >
          <Link href="/dashboard/employees" className="btn-secondary">
            {tc("cancel")}
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {uploadStatus || te("creating")}
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                {te("addEmployee")}
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Section Header — Reusable component
   ═══════════════════════════════════════════════════════ */
function SectionHeader({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-content-primary">{title}</h2>
        <p className="text-xs text-content-tertiary">{description}</p>
      </div>
    </div>
  );
}
