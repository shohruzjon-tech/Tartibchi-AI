"use client";

import { useState, useEffect } from "react";
import { useRouter } from "../../../i18n/navigation";
import { useAuthStore, useHydration } from "../../../lib/store";
import { Header } from "../../../components/header";
import { Sidebar } from "../../../components/sidebar";
import { Menu } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useHydration();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hasHydrated && !user) {
      router.push("/auth/login");
    }
    if (hasHydrated && user && !user.onboardingCompleted) {
      router.push("/onboarding");
    }
  }, [user, hasHydrated, router]);

  // Wait for store hydration before rendering anything
  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-surface-primary">
      {/* Desktop Sidebar */}
      <div className="relative z-30 hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 lg:hidden"
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Dashboard header with mobile menu toggle */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-3 bg-surface-elevated px-4 shadow-soft sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-content-secondary transition-colors hover:bg-surface-secondary lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <Header />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
