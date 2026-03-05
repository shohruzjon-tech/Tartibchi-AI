"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  KeyRound,
  ArrowRight,
  Monitor,
  Fingerprint,
  Shield,
  Zap,
} from "lucide-react";
import { useRouter } from "../../../../i18n/navigation";
import { api } from "../../../../lib/api";
import { useAuthStore, useStaffStore } from "../../../../lib/store";
import { PhoneInput } from "../../../../components/ui/phone-input";

export default function StaffLoginPage() {
  const t = useTranslations("staffAuth");
  const tc = useTranslations("common");
  const router = useRouter();
  const { setStaffAuth, setPendingSelection, staff } = useStaffStore();
  const mainToken = useAuthStore((s) => s.token);
  const mainUser = useAuthStore((s) => s.user);
  const [login, setLogin] = useState("+998");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already authenticated via main auth, redirect to counter selection
    if (mainToken && mainUser) {
      router.push("/staff/select-counter");
      return;
    }
    // If already authenticated as staff, go to counter
    if (staff) {
      router.push(`/staff/counter/${staff.counterId}`);
    }
  }, [staff, mainToken, mainUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanLogin = login.replace(/[\s\-()]/g, "");
    if (cleanLogin.length < 13) {
      setError(t("invalidPhone"));
      return;
    }
    if (passcode.length < 4) {
      setError(t("invalidPasscode"));
      return;
    }

    setLoading(true);
    try {
      const data = await api.staffAuth.login({
        login: cleanLogin,
        passcode,
      });

      if (data.counters && data.counters.length > 1) {
        setPendingSelection({
          selectionToken: data.selectionToken,
          counters: data.counters,
        });
        router.push("/staff/select-counter");
      } else {
        setStaffAuth(data);
        router.push(`/staff/counter/${data.user.counterId}`);
      }
    } catch (err: any) {
      setError(err.message || t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-primary">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent-primary/8 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -60, 80, 0],
            y: [0, 100, -40, 0],
            scale: [1, 0.8, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-accent-secondary/8 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -60, 40, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-tertiary/5 blur-3xl"
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--accent-primary) 1px, transparent 1px), linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo & Header */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 12,
            }}
            className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-primary to-accent-secondary opacity-20 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-glow-strong">
              <Monitor size={36} className="text-white" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-3xl font-bold text-content-primary"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-content-secondary"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card overflow-hidden border border-surface-tertiary/50 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-xl bg-status-error/8 px-4 py-3 text-sm font-medium text-status-error"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-content-secondary">
                <Phone size={14} />
                {t("phone")}
              </label>
              <PhoneInput
                value={login}
                onChange={setLogin}
                required
                className="py-3.5 text-lg tracking-wide font-mono"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-content-secondary">
                <KeyRound size={14} />
                {t("passcode")}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) =>
                    setPasscode(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  required
                  className="input-field py-3.5 text-center text-2xl font-bold tracking-[0.4em] font-mono"
                  placeholder="• • • • • • • •"
                  inputMode="numeric"
                  maxLength={8}
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary group w-full py-4 text-base font-bold"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                />
              ) : (
                <>
                  {t("loginButton")}
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-6 text-xs text-content-tertiary"
        >
          <span className="flex items-center gap-1.5">
            <Shield size={12} className="text-accent-primary" />
            {t("secure")}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap size={12} className="text-accent-primary" />
            {t("fast")}
          </span>
          <span className="flex items-center gap-1.5">
            <Fingerprint size={12} className="text-accent-primary" />
            {t("encrypted")}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
