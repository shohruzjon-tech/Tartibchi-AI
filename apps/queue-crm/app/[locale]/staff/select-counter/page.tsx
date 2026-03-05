"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Building2,
  MapPin,
  ArrowRight,
  Loader2,
  ChevronLeft,
  Layers,
} from "lucide-react";
import { useRouter } from "../../../../i18n/navigation";
import { api } from "../../../../lib/api";
import { useAuthStore, useStaffStore } from "../../../../lib/store";

export default function SelectCounterPage() {
  const t = useTranslations("staffAuth");
  const tc = useTranslations("common");
  const router = useRouter();

  // Main auth (TENANT_ADMIN / BRANCH_MANAGER / STAFF logged in via OTP)
  const mainToken = useAuthStore((s) => s.token);
  const mainUser = useAuthStore((s) => s.user);

  // Legacy staff auth (phone + passcode flow)
  const {
    selectionToken,
    pendingCounters,
    setStaffAuth,
    clearPendingSelection,
    staff,
  } = useStaffStore();

  const [counters, setCounters] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");

  // Determine which auth mode is active
  const useMainAuth = !!mainToken && !!mainUser;
  const useStaffAuthFlow =
    !useMainAuth && !!selectionToken && !!pendingCounters?.length;

  // Redirect if already on a counter (staff auth)
  useEffect(() => {
    if (staff) {
      router.push(`/staff/counter/${staff.counterId}`);
      return;
    }
  }, [staff, router]);

  // Fetch counters using main auth
  useEffect(() => {
    if (!useMainAuth) return;
    setFetchLoading(true);
    const params: any = {};
    if (mainUser?.tenantId) params.tenantId = mainUser.tenantId;
    if (mainUser?.branchId) params.branchId = mainUser.branchId;

    api.counters
      .list(params, mainToken!)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setCounters(list);
      })
      .catch((err: any) => setError(err.message || "Failed to load counters"))
      .finally(() => setFetchLoading(false));
  }, [useMainAuth, mainToken, mainUser]);

  // Use pending counters from staff auth
  useEffect(() => {
    if (useStaffAuthFlow && pendingCounters) {
      setCounters(pendingCounters);
    }
  }, [useStaffAuthFlow, pendingCounters]);

  // Redirect to login if no auth at all
  useEffect(() => {
    if (!useMainAuth && !useStaffAuthFlow && !staff) {
      router.push("/staff/login");
    }
  }, [useMainAuth, useStaffAuthFlow, staff, router]);

  const handleSelect = async (counterId: string) => {
    setSelectedId(counterId);
    setLoading(true);
    setError("");

    try {
      if (useMainAuth) {
        // Main auth: navigate directly to counter page
        router.push(`/staff/counter/${counterId}`);
        return;
      }

      // Staff auth: use selection token
      if (!selectionToken) return;
      const data = await api.staffAuth.selectCounter({
        selectionToken,
        counterId,
      });
      setStaffAuth(data);
      router.push(`/staff/counter/${data.user.counterId}`);
    } catch (err: any) {
      setError(err.message || t("selectionError"));
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (useMainAuth) {
      router.push("/dashboard");
    } else {
      clearPendingSelection();
      router.push("/staff/login");
    }
  };

  if (!counters.length && !fetchLoading) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-primary">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -60, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-accent-primary/8 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 60, 0],
            y: [0, 80, -30, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent-secondary/8 blur-3xl"
        />
      </div>

      {/* Grid overlay */}
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
        className="relative z-10 w-full max-w-2xl px-6"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary opacity-20 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-glow">
              <Layers size={28} className="text-white" />
            </div>
          </motion.div>
          <h1 className="mb-2 text-2xl font-bold text-content-primary">
            {t("selectWorkspace")}
          </h1>
          <p className="text-content-secondary">{t("selectWorkspaceDesc")}</p>
        </div>

        {/* Loading state */}
        {fetchLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-accent-primary" />
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden rounded-xl bg-status-error/8 px-4 py-3 text-center text-sm font-medium text-status-error"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Counter Cards */}
        {!fetchLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {counters.map((counter: any, index: number) => (
              <motion.button
                key={counter._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(counter._id)}
                disabled={loading}
                className={`group relative overflow-hidden rounded-2xl border-2 bg-surface-elevated p-6 text-left transition-all ${
                  selectedId === counter._id
                    ? "border-accent-primary shadow-glow"
                    : "border-transparent shadow-soft hover:border-accent-primary/30 hover:shadow-medium"
                } ${loading && selectedId !== counter._id ? "opacity-40" : ""}`}
              >
                {/* Loading overlay */}
                {loading && selectedId === counter._id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-surface-elevated/80 backdrop-blur-sm"
                  >
                    <Loader2
                      size={24}
                      className="animate-spin text-accent-primary"
                    />
                  </motion.div>
                )}

                {/* Counter number badge */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
                    <Monitor size={22} className="text-accent-primary" />
                  </div>
                  <span className="rounded-lg bg-accent-primary/10 px-2.5 py-1 text-xs font-bold text-accent-primary">
                    #{counter.counterNumber}
                  </span>
                </div>

                <h3 className="mb-1 text-lg font-bold text-content-primary">
                  {counter.name}
                </h3>

                <div className="space-y-1.5">
                  {counter.tenantName && (
                    <div className="flex items-center gap-2 text-sm text-content-secondary">
                      <Building2 size={13} className="shrink-0" />
                      <span className="truncate">{counter.tenantName}</span>
                    </div>
                  )}
                  {counter.branchName && (
                    <div className="flex items-center gap-2 text-sm text-content-secondary">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{counter.branchName}</span>
                    </div>
                  )}
                </div>

                {/* Select indicator */}
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-accent-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {t("selectThis")}
                  <ArrowRight size={14} />
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleBack}
            className="btn-ghost inline-flex items-center gap-2 text-sm"
          >
            <ChevronLeft size={16} />
            {useMainAuth ? tc("dashboard") : t("backToLogin")}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
