"use client";

import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation";
import { motion } from "framer-motion";
import {
  Zap,
  Bell,
  BarChart3,
  Globe,
  Shield,
  Clock,
  Users,
  Smartphone,
  ArrowRight,
  Star,
  Building2,
  Layers,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";

const HeroBackground = dynamic(
  () =>
    import("./hero-background").then((mod) => ({
      default: mod.HeroBackground,
    })),
  { ssr: false },
);

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export function LandingContent() {
  const t = useTranslations();

  const features = [
    { key: "realtime", icon: Zap, gradient: "from-amber-500 to-orange-500" },
    { key: "sms", icon: Bell, gradient: "from-emerald-500 to-teal-500" },
    {
      key: "analytics",
      icon: BarChart3,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      key: "multilingual",
      icon: Globe,
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  const advancedFeatures = [
    {
      icon: Shield,
      titleKey: "security",
      gradient: "from-rose-500 to-pink-500",
    },
    {
      icon: Clock,
      titleKey: "scheduling",
      gradient: "from-amber-500 to-yellow-500",
    },
    {
      icon: Users,
      titleKey: "multiTenant",
      gradient: "from-sky-500 to-blue-500",
    },
    {
      icon: Smartphone,
      titleKey: "mobile",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: Layers,
      titleKey: "api",
      gradient: "from-violet-500 to-indigo-500",
    },
    {
      icon: Sparkles,
      titleKey: "whiteLabel",
      gradient: "from-fuchsia-500 to-pink-500",
    },
  ];

  const stats = [
    { value: "99.9%", labelKey: "uptime" },
    { value: "<2s", labelKey: "sync" },
    { value: "50K+", labelKey: "tickets" },
    { value: "24/7", labelKey: "support" },
  ];

  const steps = [
    { step: "01", titleKey: "step1", icon: Building2 },
    { step: "02", titleKey: "step2", icon: Users },
    { step: "03", titleKey: "step3", icon: BarChart3 },
  ];

  const testimonials = [
    { key: "t1", rating: 5 },
    { key: "t2", rating: 5 },
    { key: "t3", rating: 5 },
  ];

  return (
    <main className="overflow-hidden">
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <HeroBackground />

        {/* Subtle gradient overlays — semi-transparent so Three.js shows through */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-surface-primary/60 via-transparent to-surface-primary pointer-events-none" />

        <div className="relative z-[2] mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-primary/10 px-4 py-1.5 text-sm font-medium text-accent-primary"
            >
              <Sparkles size={14} />
              <span>{t("landing.badge")}</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-content-primary sm:text-7xl"
            >
              {t("home.hero").split(" ").slice(0, -1).join(" ")}{" "}
              <span className="gradient-text">
                {t("home.hero").split(" ").slice(-1)}
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto mb-10 max-w-2xl text-lg text-content-secondary sm:text-xl"
            >
              {t("home.subtitle")}
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link
                href="/queue"
                className="btn-primary px-8 py-3.5 text-base shadow-glow"
              >
                {t("home.getTicket")}
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/auth/login"
                className="btn-secondary px-8 py-3.5 text-base"
              >
                {t("home.manageQueues")}
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 z-[1] h-32 bg-gradient-to-t from-surface-primary to-transparent" />
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative z-10 -mt-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto grid max-w-4xl grid-cols-2 gap-4 rounded-2xl bg-surface-elevated p-6 shadow-large sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.labelKey} className="text-center">
              <p className="text-2xl font-bold gradient-text sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-content-tertiary">
                {t(`landing.stats.${stat.labelKey}`)}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── Core Features ─── */}
      <section id="features" className="px-6 py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-content-primary sm:text-4xl">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-content-secondary">
              {t("landing.featuresDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group card p-6 hover:shadow-large transition-all duration-300"
                >
                  <div
                    className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.gradient} p-2.5 shadow-md`}
                  >
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-content-primary">
                    {t(`home.features.${f.key}`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-content-secondary">
                    {t(`home.features.${f.key}Desc`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="bg-surface-secondary/50 px-6 py-24 scroll-mt-20"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-content-primary sm:text-4xl">
              {t("landing.howItWorksTitle")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-content-secondary">
              {t("landing.howItWorksDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative"
              >
                <div className="card p-8">
                  <span className="mb-4 block text-4xl font-black text-accent-primary/15">
                    {item.step}
                  </span>
                  <item.icon
                    size={28}
                    className="mb-4 text-accent-primary"
                    strokeWidth={1.5}
                  />
                  <h3 className="mb-2 text-lg font-semibold text-content-primary">
                    {t(`landing.steps.${item.titleKey}`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-content-secondary">
                    {t(`landing.steps.${item.titleKey}Desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Advanced Features Grid ─── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-content-primary sm:text-4xl">
              {t("landing.advancedTitle")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-content-secondary">
              {t("landing.advancedDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {advancedFeatures.map((f, i) => (
              <motion.div
                key={f.titleKey}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="card group p-6 transition-all duration-300 hover:shadow-large"
              >
                <div
                  className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.gradient} p-2.5 shadow-md`}
                >
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-content-primary">
                  {t(`landing.advanced.${f.titleKey}`)}
                </h3>
                <p className="text-sm leading-relaxed text-content-secondary">
                  {t(`landing.advanced.${f.titleKey}Desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-surface-secondary/50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-content-primary sm:text-4xl">
              {t("landing.testimonialsTitle")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-content-secondary">
              {t("landing.testimonialsDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="card p-6"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: item.rating }).map((_, j) => (
                    <Star
                      key={j}
                      size={16}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-content-secondary">
                  &ldquo;{t(`landing.testimonials.${item.key}Text`)}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-content-primary">
                    {t(`landing.testimonials.${item.key}Name`)}
                  </p>
                  <p className="text-xs text-content-tertiary">
                    {t(`landing.testimonials.${item.key}Role`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-accent-primary to-accent-secondary p-12 text-center shadow-glow"
        >
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
            {t("landing.ctaDesc")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-accent-primary shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {t("landing.startFree")}
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/queue"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25"
            >
              {t("landing.liveDemo")}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
                  <span className="text-sm font-bold text-white">Q</span>
                </div>
                <span className="text-lg font-semibold gradient-text">
                  QueuePro
                </span>
              </div>
              <p className="text-sm text-content-tertiary">
                {t("landing.footer.tagline")}
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-content-primary">
                {t("landing.footer.product")}
              </h4>
              <ul className="space-y-2 text-sm text-content-tertiary">
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.features")}
                </li>
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.integrations")}
                </li>
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.apiDocs")}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-content-primary">
                {t("landing.footer.company")}
              </h4>
              <ul className="space-y-2 text-sm text-content-tertiary">
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.about")}
                </li>
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.blog")}
                </li>
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.careers")}
                </li>
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.contact")}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-content-primary">
                {t("landing.footer.legal")}
              </h4>
              <ul className="space-y-2 text-sm text-content-tertiary">
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.privacy")}
                </li>
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.terms")}
                </li>
                <li className="transition-colors hover:text-content-secondary cursor-pointer">
                  {t("landing.footer.security")}
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-surface-tertiary pt-8 sm:flex-row">
            <p className="text-sm text-content-tertiary">
              {t("landing.footer.copyright")}
            </p>
            <div className="flex gap-4 text-content-tertiary">
              <span className="cursor-pointer transition-colors hover:text-content-secondary text-sm">
                Twitter
              </span>
              <span className="cursor-pointer transition-colors hover:text-content-secondary text-sm">
                GitHub
              </span>
              <span className="cursor-pointer transition-colors hover:text-content-secondary text-sm">
                LinkedIn
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
