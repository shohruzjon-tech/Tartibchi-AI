"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "../i18n/navigation";
import { routing, type Locale } from "../i18n/routing";
import { Globe } from "lucide-react";
import { Dropdown } from "./ui/dropdown";

const LOCALE_DATA: Record<string, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  ru: { label: "Русский", flag: "🇷🇺" },
  uz: { label: "O'zbekcha", flag: "🇺🇿" },
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as Locale });
  };

  const items = routing.locales.map((loc) => ({
    key: loc,
    label: LOCALE_DATA[loc]?.label || loc,
    icon: <span className="text-base">{LOCALE_DATA[loc]?.flag}</span>,
  }));

  return (
    <Dropdown
      trigger={
        <div className="flex items-center gap-2 rounded-xl bg-surface-secondary/60 px-3 py-2 text-sm font-medium text-content-secondary transition-all hover:bg-surface-tertiary">
          <Globe size={16} strokeWidth={1.8} />
          <span>{locale.toUpperCase()}</span>
        </div>
      }
      items={items}
      onSelect={switchLocale}
    />
  );
}
