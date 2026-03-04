"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, CheckCircle2, Languages, X } from "lucide-react";
import { ResponsivePicker } from "./responsive-picker";

const AVAILABLE_LANGUAGES = [
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "kk", label: "Қазақша" },
  { code: "tg", label: "Тоҷикӣ" },
  { code: "ky", label: "Кыргызча" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "hi", label: "हिन्दी" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

interface LanguagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selected: string[];
  onSelectionChange: (codes: string[]) => void;
}

export function LanguagePicker({
  isOpen,
  onClose,
  selected,
  onSelectionChange,
}: LanguagePickerProps) {
  const tc = useTranslations("counters");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      AVAILABLE_LANGUAGES.filter(
        (l) =>
          l.label.toLowerCase().includes(search.toLowerCase()) ||
          l.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const toggle = (code: string) => {
    onSelectionChange(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code],
    );
  };

  return (
    <ResponsivePicker
      isOpen={isOpen}
      onClose={onClose}
      title={tc("selectLanguages")}
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-content-tertiary">
          {tc("selectLanguagesDesc")}
        </p>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder={tc("searchLanguages")}
          />
        </div>

        {/* List */}
        <div className="max-h-72 space-y-1.5 overflow-y-auto">
          {filtered.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => toggle(lang.code)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                selected.includes(lang.code)
                  ? "bg-accent-primary/10 ring-2 ring-accent-primary"
                  : "bg-surface-secondary hover:bg-surface-tertiary"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold uppercase ${
                  selected.includes(lang.code)
                    ? "bg-accent-primary text-white"
                    : "bg-surface-tertiary text-content-secondary"
                }`}
              >
                {lang.code}
              </div>
              <span className="flex-1 text-sm font-medium text-content-primary">
                {lang.label}
              </span>
              {selected.includes(lang.code) && (
                <CheckCircle2
                  size={18}
                  className="shrink-0 text-accent-primary"
                />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-primary pt-4">
          <span className="text-xs text-content-tertiary">
            {tc("languagesCount", { count: selected.length })}
          </span>
          <button type="button" onClick={onClose} className="btn-primary">
            {tc("done")}
          </button>
        </div>
      </div>
    </ResponsivePicker>
  );
}

/** Inline trigger button for the language picker */
interface LanguageTriggerProps {
  selected: string[];
  onClick: () => void;
}

export function LanguageTrigger({ selected, onClick }: LanguageTriggerProps) {
  const tc = useTranslations("counters");

  const selectedLabels = AVAILABLE_LANGUAGES.filter((l) =>
    selected.includes(l.code),
  ).map((l) => l.label);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-content-secondary">
        {tc("selectLanguages")}
      </label>
      <button
        type="button"
        onClick={onClick}
        className="input-field flex w-full items-center gap-2 text-left"
      >
        <Languages size={16} className="shrink-0 text-content-tertiary" />
        {selectedLabels.length > 0 ? (
          <span className="flex-1 truncate text-sm text-content-primary">
            {selectedLabels.join(", ")}
          </span>
        ) : (
          <span className="flex-1 text-sm text-content-tertiary">
            {tc("noLanguagesSelected")}
          </span>
        )}
        <span className="shrink-0 rounded-md bg-accent-primary/10 px-2 py-0.5 text-xs font-semibold text-accent-primary">
          {selected.length}
        </span>
      </button>
      {selectedLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md bg-accent-primary/8 px-2 py-1 text-xs font-medium text-accent-primary"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
