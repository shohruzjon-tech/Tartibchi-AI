"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  ArrowRight,
  ArrowLeft,
  Shield,
  Zap,
  Fingerprint,
  Building2,
  Crown,
  UserCog,
  Users,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Link, useRouter } from "../../../../i18n/navigation";
import { api } from "../../../../lib/api";
import { useAuthStore, useHydration } from "../../../../lib/store";
import { PhoneInput } from "../../../../components/ui/phone-input";
import { OtpInput } from "../../../../components/otp-input";

interface Workspace {
  id: string;
  name: string;
  branchName?: string;
  branchId?: string;
  tenantId: string;
}

interface RoleOption {
  role: string;
  label: string;
  description: string;
}

const ROLE_CONFIG: Record<
  string,
  {
    icon: typeof Crown;
    color: string;
    gradient: string;
    redirectTo: string;
  }
> = {
  TENANT_ADMIN: {
    icon: Crown,
    color: "text-amber-500",
    gradient: "from-amber-500 to-orange-600",
    redirectTo: "/dashboard",
  },
  BRANCH_MANAGER: {
    icon: UserCog,
    color: "text-blue-500",
    gradient: "from-blue-500 to-indigo-600",
    redirectTo: "/manager",
  },
  STAFF: {
    icon: Users,
    color: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-600",
    redirectTo: "/staff/login",
  },
};

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useHydration();

  const [step, setStep] = useState<"phone" | "otp" | "workspace" | "role">(
    "phone",
  );
  const [phone, setPhone] = useState("+998");
  const [otpCode, setOtpCode] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  );
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (hasHydrated && user) {
      const roleConfig = ROLE_CONFIG[user.role];
      router.push(roleConfig?.redirectTo || "/dashboard");
    }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (otpCode.length === 6 && step === "otp") {
      handleVerifyOtp();
    }
  }, [otpCode]);

  const handleRequestOtp = async () => {
    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    if (cleanPhone.length < 13) {
      setError(t("invalidPhone"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.auth.requestOtp({ phone: cleanPhone });
      setStep("otp");
      setCountdown(120);
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return;
    setError("");
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[\s\-()]/g, "");
      const result = await api.auth.loginWithOtp({
        phone: cleanPhone,
        code: otpCode,
      });

      if (result.accessToken && result.user) {
        setAuth(result);
        const roleConfig = ROLE_CONFIG[result.user.role];
        router.push(roleConfig?.redirectTo || "/dashboard");
        return;
      }

      if (result.workspaces && result.workspaces.length > 0) {
        setSessionToken(result.sessionToken);
        setWorkspaces(result.workspaces);

        if (result.workspaces.length === 1) {
          await handleSelectWorkspace(
            result.workspaces[0],
            result.sessionToken,
          );
        } else {
          setStep("workspace");
        }
        return;
      }

      setError(t("noWorkspaces"));
    } catch (err: any) {
      setError(err.message || t("invalidOtp"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = async (
    workspace: Workspace,
    token?: string,
  ) => {
    setSelectedWorkspace(workspace);
    setError("");
    setLoading(true);
    try {
      const result = await api.auth.selectWorkspace(
        { workspaceId: workspace.id },
        token || sessionToken,
      );

      if (result.accessToken && result.user) {
        setAuth(result);
        const roleConfig = ROLE_CONFIG[result.user.role];
        router.push(roleConfig?.redirectTo || "/dashboard");
        return;
      }

      if (result.roles && result.roles.length > 0) {
        setSessionToken(result.sessionToken || sessionToken);
        setRoles(result.roles);

        if (result.roles.length === 1) {
          await handleSelectRole(result.roles[0].role, result.sessionToken);
        } else {
          setStep("role");
        }
        return;
      }
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (role: string, token?: string) => {
    setError("");
    setLoading(true);
    try {
      const result = await api.auth.selectRole(
        {
          role,
          workspaceId: selectedWorkspace?.id || "",
        },
        token || sessionToken,
      );
      setAuth(result);
      const roleConfig = ROLE_CONFIG[role];
      router.push(roleConfig?.redirectTo || "/dashboard");
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError("");
    try {
      await api.auth.requestOtp({
        phone: phone.replace(/[\s\-()]/g, ""),
      });
      setCountdown(120);
    } catch (err: any) {
      setError(err.message || tc("error"));
    }
  };

  const goBack = () => {
    setError("");
    if (step === "otp") {
      setStep("phone");
      setOtpCode("");
    } else if (step === "workspace") {
      setStep("otp");
      setOtpCode("");
    } else if (step === "role") {
      if (workspaces.length > 1) {
        setStep("workspace");
      } else {
        setStep("otp");
        setOtpCode("");
      }
    }
  };

  const stepTitle = {
    phone: t("loginTitle"),
    otp: t("otpTitle"),
    workspace: t("selectWorkspace"),
    role: t("selectRole"),
  };

  const stepSubtitle = {
    phone: t("loginSubtitle"),
    otp: t("otpSubtitle", { phone }),
    workspace: t("selectWorkspaceDesc"),
    role: t("selectRoleDesc"),
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-primary">
      {/* Subtle ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent-primary/[0.03] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-[400px] px-5 py-10"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-lg shadow-accent-primary/20"
          >
            {step === "phone" && <Phone size={22} className="text-white" />}
            {step === "otp" && <Shield size={22} className="text-white" />}
            {step === "workspace" && (
              <Building2 size={22} className="text-white" />
            )}
            {step === "role" && <Sparkles size={22} className="text-white" />}
          </motion.div>

          <motion.h1
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-1 text-xl font-bold tracking-tight text-content-primary"
          >
            {stepTitle[step]}
          </motion.h1>
          <motion.p
            key={`sub-${step}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[13px] text-content-secondary"
          >
            {stepSubtitle[step]}
          </motion.p>
        </div>

        {/* Card Content */}
        <AnimatePresence mode="wait">
          {/* ─── Phone Step ─── */}
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-surface-tertiary/50 bg-surface-elevated p-5 shadow-soft"
            >
              <div className="space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg bg-status-error/8 px-3 py-2 text-[13px] font-medium text-status-error"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-content-secondary">
                    <Phone size={12} />
                    {t("phone")}
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    required
                    className="py-2.5 text-[15px] tracking-wide font-mono"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRequestOtp}
                  disabled={loading || phone.length < 13}
                  className="btn-primary group w-full py-2.5 text-[13px] font-semibold"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      {t("requestOtp")}
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── OTP Step ─── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-surface-tertiary/50 bg-surface-elevated p-5 shadow-soft"
            >
              <div className="space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg bg-status-error/8 px-3 py-2 text-[13px] font-medium text-status-error"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-center">
                  <p className="text-[13px] text-content-secondary">
                    {t("otpSentTo")}
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold font-mono text-content-primary tracking-wider">
                    {phone}
                  </p>
                </div>

                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  autoFocus
                  disabled={loading}
                />

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-[13px] text-content-tertiary">
                      {t("resendIn")}{" "}
                      <span className="font-semibold text-accent-primary">
                        {Math.floor(countdown / 60)}:
                        {String(countdown % 60).padStart(2, "0")}
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-[13px] font-semibold text-accent-primary hover:text-accent-secondary transition-colors"
                    >
                      {t("resendCode")}
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={goBack}
                    className="btn-ghost flex-1 py-2 text-[13px]"
                  >
                    <ArrowLeft size={13} />
                    {tc("back")}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleVerifyOtp}
                    disabled={loading || otpCode.length < 6}
                    className="btn-primary flex-[2] py-2 text-[13px] font-semibold"
                  >
                    {loading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        {t("verifyButton")}
                        <ArrowRight size={13} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Workspace Selection ─── */}
          {step === "workspace" && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 rounded-lg bg-status-error/8 px-3 py-2 text-[13px] font-medium text-status-error"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                {workspaces.map((ws, i) => (
                  <motion.button
                    key={ws.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectWorkspace(ws)}
                    disabled={loading}
                    className={`group w-full rounded-xl border bg-surface-elevated px-4 py-3.5 text-left transition-all ${
                      loading
                        ? "opacity-50"
                        : "border-surface-tertiary/50 hover:border-accent-primary/25 hover:shadow-soft"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-primary/8">
                        <Building2 size={16} className="text-accent-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-content-primary truncate">
                          {ws.name}
                        </p>
                        {ws.branchName && (
                          <p className="text-[11px] text-content-tertiary truncate mt-0.5">
                            {ws.branchName}
                          </p>
                        )}
                      </div>
                      <ArrowRight
                        size={13}
                        className="text-content-tertiary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5"
                      />
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={goBack}
                  className="btn-ghost inline-flex items-center gap-1.5 text-[13px]"
                >
                  <ArrowLeft size={13} />
                  {tc("back")}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Role Selection ─── */}
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 rounded-lg bg-status-error/8 px-3 py-2 text-[13px] font-medium text-status-error"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                {roles.map((roleOption, i) => {
                  const config =
                    ROLE_CONFIG[roleOption.role] || ROLE_CONFIG.STAFF;
                  const Icon = config.icon;
                  return (
                    <motion.button
                      key={roleOption.role}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectRole(roleOption.role)}
                      disabled={loading}
                      className={`group w-full rounded-xl border bg-surface-elevated px-4 py-3.5 text-left transition-all ${
                        loading
                          ? "opacity-50"
                          : "border-surface-tertiary/50 hover:border-accent-primary/25 hover:shadow-soft"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${config.gradient}`}
                        >
                          <Icon size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-content-primary">
                            {roleOption.label}
                          </p>
                          <p className="text-[11px] text-content-tertiary mt-0.5">
                            {roleOption.description}
                          </p>
                        </div>
                        <ArrowRight
                          size={13}
                          className="text-content-tertiary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5"
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={goBack}
                  className="btn-ghost inline-flex items-center gap-1.5 text-[13px]"
                >
                  <ArrowLeft size={13} />
                  {tc("back")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Register link */}
        {step === "phone" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center text-[13px] text-content-secondary"
          >
            {t("noAccount")}{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-accent-primary hover:text-accent-secondary transition-colors"
            >
              {tc("register")}
            </Link>
          </motion.p>
        )}

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-8 flex items-center justify-center gap-5 text-[11px] text-content-tertiary"
        >
          <span className="flex items-center gap-1">
            <Shield size={10} className="text-accent-primary/50" />
            {t("secure")}
          </span>
          <span className="flex items-center gap-1">
            <Zap size={10} className="text-accent-primary/50" />
            {t("noPassword")}
          </span>
          <span className="flex items-center gap-1">
            <Fingerprint size={10} className="text-accent-primary/50" />
            {t("otpVerified")}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
