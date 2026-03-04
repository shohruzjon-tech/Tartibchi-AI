"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, X } from "lucide-react";

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

type PresetKey =
  | "all"
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "90d"
  | "custom";

interface Preset {
  key: PresetKey;
  labelKey: string;
}

const PRESETS: Preset[] = [
  { key: "all", labelKey: "allTime" },
  { key: "today", labelKey: "today" },
  { key: "yesterday", labelKey: "yesterday" },
  { key: "7d", labelKey: "last7Days" },
  { key: "30d", labelKey: "last30Days" },
  { key: "90d", labelKey: "last90Days" },
  { key: "custom", labelKey: "customRange" },
];

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  labels: {
    allTime: string;
    today: string;
    yesterday: string;
    last7Days: string;
    last30Days: string;
    last90Days: string;
    customRange: string;
    from: string;
    to: string;
    apply: string;
    clear: string;
  };
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getPresetRange(key: PresetKey): DateRange {
  const now = new Date();
  switch (key) {
    case "all":
      return { startDate: null, endDate: null };
    case "today":
      return { startDate: toDateStr(now), endDate: toDateStr(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { startDate: toDateStr(y), endDate: toDateStr(y) };
    }
    case "7d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { startDate: toDateStr(s), endDate: toDateStr(now) };
    }
    case "30d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { startDate: toDateStr(s), endDate: toDateStr(now) };
    }
    case "90d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 89);
      return { startDate: toDateStr(s), endDate: toDateStr(now) };
    }
    default:
      return { startDate: null, endDate: null };
  }
}

function detectPreset(range: DateRange): PresetKey {
  if (!range.startDate && !range.endDate) return "all";
  if (!range.startDate || !range.endDate) return "custom";
  const now = new Date();
  const todayStr = toDateStr(now);
  const yesterdayStr = toDateStr(new Date(now.getTime() - 86_400_000));
  if (range.startDate === todayStr && range.endDate === todayStr)
    return "today";
  if (range.startDate === yesterdayStr && range.endDate === yesterdayStr)
    return "yesterday";
  const diff =
    Math.round(
      (new Date(range.endDate).getTime() -
        new Date(range.startDate).getTime()) /
        86_400_000,
    ) + 1;
  if (range.endDate === todayStr) {
    if (diff === 7) return "7d";
    if (diff === 30) return "30d";
    if (diff === 90) return "90d";
  }
  return "custom";
}

export function DateRangePicker({
  value,
  onChange,
  labels,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>(() =>
    detectPreset(value),
  );
  const [customStart, setCustomStart] = useState(value.startDate || "");
  const [customEnd, setCustomEnd] = useState(value.endDate || "");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handlePreset = (key: PresetKey) => {
    setActivePreset(key);
    if (key !== "custom") {
      const range = getPresetRange(key);
      onChange(range);
      setCustomStart(range.startDate || "");
      setCustomEnd(range.endDate || "");
      setOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onChange({ startDate: customStart, endDate: customEnd });
      setOpen(false);
    }
  };

  const handleClear = () => {
    setActivePreset("all");
    setCustomStart("");
    setCustomEnd("");
    onChange({ startDate: null, endDate: null });
    setOpen(false);
  };

  const displayLabel =
    activePreset === "custom" && value.startDate && value.endDate
      ? `${value.startDate} – ${value.endDate}`
      : labels[
          PRESETS.find((p) => p.key === activePreset)
            ?.labelKey as keyof typeof labels
        ] || labels.allTime;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary/80"
      >
        <Calendar size={14} className="text-content-tertiary" />
        <span className="max-w-[200px] truncate">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`text-content-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-2xl bg-surface-elevated p-3 shadow-lg ring-1 ring-border-primary/10"
          >
            {/* Preset buttons */}
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePreset(preset.key)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    activePreset === preset.key
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-content-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {labels[preset.labelKey as keyof typeof labels]}
                </button>
              ))}
            </div>

            {/* Custom date inputs */}
            {activePreset === "custom" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-3 space-y-2 rounded-xl bg-surface-secondary/50 p-3">
                  <div>
                    <label className="mb-1 block text-xs text-content-tertiary">
                      {labels.from}
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-sm text-content-primary outline-none ring-1 ring-border-primary/10 focus:ring-accent-primary/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-content-tertiary">
                      {labels.to}
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      min={customStart || undefined}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-sm text-content-primary outline-none ring-1 ring-border-primary/10 focus:ring-accent-primary/40"
                    />
                  </div>
                  <button
                    onClick={handleApplyCustom}
                    disabled={!customStart || !customEnd}
                    className="w-full rounded-lg bg-accent-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-40"
                  >
                    {labels.apply}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Clear button */}
            {(value.startDate || value.endDate) && (
              <button
                onClick={handleClear}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-content-tertiary transition-colors hover:text-content-secondary"
              >
                <X size={12} />
                {labels.clear}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
