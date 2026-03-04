"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Phone,
  Building2,
  User,
  Mail,
  Shield,
  Zap,
  Fingerprint,
  CheckCircle2,
  Loader2,
  Rocket,
} from "lucide-react";
import { Link, useRouter } from "../../../../i18n/navigation";
import { api } from "../../../../lib/api";
import { useAuthStore, useHydration } from "../../../../lib/store";
import { PhoneInput } from "../../../../components/ui/phone-input";
import { OtpInput } from "../../../../components/otp-input";

const STEPS = ["info", "otp", "success"] as const;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useHydration();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "+998",
    email: "",
    businessName: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (hasHydrated && user) {
      router.push("/dashboard");
    }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleRequestOtp = async () => {
    const cleanPhone = form.phone.replace(/[\s\-()]/g, "");
    if (cleanPhone.length < 13) {
      setError(t("invalidPhone"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.auth.requestOtp({ phone: cleanPhone });
      setStep(1);
      setCountdown(120);
    } catch (err: any) {
      setError(err.message || tc("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode.length < 6) {
      setError(t("invalidOtp"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const otpResult = await api.auth.verifyOtp({
        phone: form.phone.replace(/[\s\-()]/g, ""),
        code: otpCode,
      });

      const data = await api.auth.register({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone.replace(/[\s\-()]/g, ""),
        email: form.email || undefined,
        tenantName: form.businessName,
        otpToken: otpResult.otpToken,
      });
      setAuth(data);
      setStep(2);
      setTimeout(() => router.push("/onboarding"), 2000);
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
        phone: form.phone.replace(/[\s\-()]/g, ""),
      });
      setCountdown(120);
    } catch (err: any) {
      setError(err.message || tc("error"));
    }
  };

  const canProceedStep0 =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.length >= 13 &&
    form.businessName.trim();

  const stepIcon = [UserPlus, Shield, Rocket][step];
  const StepIcon = stepIcon || UserPlus;

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
        className="relative z-10 w-full max-w-[420px] px-5 py-8"
      >
        {/* Step indicator */}
        <div className="mb-7 flex items-center justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                  step > i
                    ? "bg-accent-primary text-white"
                    : step === i
                      ? "bg-accent-primary text-white"
                      : "bg-surface-tertiary/60 text-content-tertiary"
                }`}
              >
                {step > i ? <CheckCircle2 size={12} /> : <span>{i + 1}</span>}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 rounded-full transition-colors duration-400 ${
                    step > i ? "bg-accent-primary" : "bg-surface-tertiary/60"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-7 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-lg shadow-accent-primary/20"
          >
            <StepIcon size={22} className="text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-1 text-xl font-bold tracking-tight text-content-primary"
          >
            {step === 0
              ? t("registerTitle")
              : step === 1
                ? t("otpTitle")
                : t("accountCreated")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[13px] text-content-secondary"
          >
            {step === 0
              ? t("registerSubtitle")
              : step === 1
                ? t("otpSubtitle", { phone: form.phone })
                : t("redirecting")}
          </motion.p>
        </div>

        {/* Card Content */}
        <AnimatePresence mode="wait">
          {/* ─── Step 0: Personal Info ─── */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-surface-tertiary/50 bg-surface-elevated p-5 shadow-soft"
            >
              <div className="space-y-3.5">
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

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[12px] font-medium text-content-secondary">
                      <User size={11} />
                      {t("firstName")}
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={update("firstName")}
                      required
                      className="input-field py-2.5 text-[13px]"
                      placeholder={t("firstNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[12px] font-medium text-content-secondary">
                      <User size={11} />
                      {t("lastName")}
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={update("lastName")}
                      required
                      className="input-field py-2.5 text-[13px]"
                      placeholder={t("lastNamePlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[12px] font-medium text-content-secondary">
                    <Phone size={11} />
                    {t("phone")}
                    <span className="text-status-error">*</span>
                  </label>
                  <PhoneInput
                    value={form.phone}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                    required
                    className="py-2.5 text-[14px]"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[12px] font-medium text-content-secondary">
                    <Building2 size={11} />
                    {t("businessName")}
                    <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={update("businessName")}
                    required
                    className="input-field py-2.5 text-[13px]"
                    placeholder={t("businessNamePlaceholder")}
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[12px] font-medium text-content-secondary">
                    <Mail size={11} />
                    {t("email")}
                    <span className="ml-0.5 text-[11px] font-normal text-content-tertiary">
                      ({t("optional")})
                    </span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    className="input-field py-2.5 text-[13px]"
                    placeholder="you@company.com"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRequestOtp}
                  disabled={loading || !canProceedStep0}
                  className="btn-primary group w-full py-2.5 text-[13px] font-semibold"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      {t("continueWithOtp")}
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

          {/* ─── Step 1: OTP Verification ─── */}
          {step === 1 && (
            <motion.div
              key="step-1"
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
                    {form.phone}
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
                    onClick={() => {
                      setStep(0);
                      setOtpCode("");
                      setError("");
                    }}
                    className="btn-ghost flex-1 py-2 text-[13px]"
                  >
                    <ArrowLeft size={13} />
                    {tc("back")}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleVerifyAndRegister}
                    disabled={loading || otpCode.length < 6}
                    className="btn-primary flex-[2] py-2 text-[13px] font-semibold"
                  >
                    {loading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        {t("verifyAndCreate")}
                        <ArrowRight size={13} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Step 2: Success ─── */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="rounded-2xl border border-status-success/20 bg-surface-elevated p-6 text-center shadow-soft"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.15,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-status-success to-emerald-600 shadow-lg shadow-status-success/20"
              >
                <CheckCircle2 size={28} className="text-white" />
              </motion.div>
              <h2 className="text-lg font-bold text-content-primary mb-1.5">
                {t("welcomeAboard")}
              </h2>
              <p className="text-[13px] text-content-secondary mb-4">
                {t("settingUpWorkspace")}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-accent-primary">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[13px] font-medium">
                  {t("redirecting")}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login link */}
        {step < 2 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center text-[13px] text-content-secondary"
          >
            {t("hasAccount")}{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-accent-primary hover:text-accent-secondary transition-colors"
            >
              {tc("login")}
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
