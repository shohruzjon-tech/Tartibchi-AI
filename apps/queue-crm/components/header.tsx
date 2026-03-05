"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { Link, usePathname } from "../i18n/navigation";
import { useAuthStore } from "../lib/store";
import { Dropdown } from "./ui/dropdown";
import { WorkspaceRoleSwitcher } from "./workspace-role-switcher";
import {
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

export function Header() {
  const t = useTranslations("common");
  const tl = useTranslations("landing");
  const { user, clearAuth } = useAuthStore();
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLanding = pathname === "/" || pathname === "";

  const navSections = [
    { id: "features", label: tl("nav.features") },
    { id: "how-it-works", label: tl("nav.howItWorks") },
  ];

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileOpen(false);
    }
  };

  const userMenuItems = [
    {
      key: "dashboard",
      label: t("dashboard"),
      icon: <LayoutDashboard size={16} />,
    },
    { key: "settings", label: t("settings"), icon: <Settings size={16} /> },
    { key: "divider", label: "", divider: true },
    {
      key: "logout",
      label: t("logout"),
      icon: <LogOut size={16} />,
      danger: true,
    },
  ];

  const handleUserAction = (key: string) => {
    if (key === "logout") clearAuth();
  };

  // In dashboard mode, render just inline controls (parent layout provides the bar)
  if (isDashboard) {
    return (
      <div className="flex flex-1 items-center justify-between">
        <div className="ml-auto flex items-center gap-3">
          <WorkspaceRoleSwitcher />
          <LanguageSwitcher />
          <ThemeToggle />
          <Dropdown
            trigger={
              <div className="flex items-center gap-2.5 rounded-xl bg-surface-secondary/60 py-1.5 pl-1.5 pr-3 transition-all hover:bg-surface-tertiary">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
                  <User size={14} className="text-white" />
                </div>
                <span className="hidden text-sm font-medium text-content-primary sm:inline">
                  {user?.firstName}
                </span>
                <ChevronDown size={14} className="text-content-tertiary" />
              </div>
            }
            items={userMenuItems}
            onSelect={handleUserAction}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="glass sticky top-0 z-40 shadow-soft">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
                <span className="text-sm font-bold text-white">Q</span>
              </div>
              <span className="text-lg font-semibold gradient-text">
                {t("appName")}
              </span>
            </Link>

            {/* Desktop Right Side */}
            <div className="hidden items-center gap-3 md:flex">
              {/* Section Navigation */}
              {isLanding && (
                <nav className="mr-2 flex items-center gap-1">
                  {navSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
                    >
                      {section.label}
                    </button>
                  ))}
                </nav>
              )}

              <LanguageSwitcher />
              <ThemeToggle />

              {user ? (
                <Link
                  href="/dashboard"
                  className="btn-primary gap-2 px-5 py-2.5 text-sm"
                >
                  {t("dashboard")}
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" className="btn-ghost text-sm">
                    {t("login")}
                  </Link>
                  <Link href="/auth/register" className="btn-primary text-sm">
                    {t("register")}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-content-secondary transition-colors hover:bg-surface-secondary md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-surface-elevated shadow-large md:hidden"
            >
              {/* Mobile Menu Header */}
              <div className="flex h-16 items-center justify-between px-5">
                <span className="text-lg font-semibold gradient-text">
                  {t("menu")}
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-content-secondary hover:bg-surface-secondary"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Menu Body */}
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {/* Section Nav */}
                {isLanding && (
                  <div className="space-y-1">
                    {navSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                )}

                {isLanding && <div className="h-px bg-surface-tertiary" />}

                {/* Theme & Language */}
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>

                <div className="h-px bg-surface-tertiary" />

                {user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl bg-surface-secondary/60 p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-content-primary">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-content-tertiary">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary w-full justify-center gap-2 py-3"
                    >
                      <LayoutDashboard size={16} />
                      {t("dashboard")}
                    </Link>

                    <button
                      onClick={() => {
                        clearAuth();
                        setMobileOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-status-error transition-colors hover:bg-status-error/8"
                    >
                      <LogOut size={16} />
                      {t("logout")}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-secondary w-full justify-center py-3"
                    >
                      {t("login")}
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary w-full justify-center py-3"
                    >
                      {t("register")}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
