"use client";

import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal, RotateCcw, Check, Search } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  key: string;
  label: string;
  icon?: ReactNode;
  options: FilterOption[];
  type?: "single" | "multi";
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  groups: FilterGroup[];
  values: Record<string, string | string[]>;
  onChange: (key: string, value: string | string[]) => void;
  onReset: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function FilterModal({
  isOpen,
  onClose,
  title = "Filters",
  groups,
  values,
  onChange,
  onReset,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
}: FilterModalProps) {
  const activeFilterCount = Object.values(values).filter((v) =>
    Array.isArray(v) ? v.length > 0 : !!v,
  ).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-surface-elevated overflow-hidden"
          >
            {/* Neon top border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-60" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary/10">
                  <SlidersHorizontal
                    size={16}
                    className="text-accent-primary"
                  />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-content-primary">
                    {title}
                  </h2>
                  {activeFilterCount > 0 && (
                    <p className="text-[11px] text-accent-primary font-medium">
                      {activeFilterCount} active filter
                      {activeFilterCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-secondary hover:bg-surface-secondary transition-colors"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary hover:text-content-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search */}
            {onSearchChange && (
              <div className="px-5 pb-3">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary"
                  />
                  <input
                    type="text"
                    value={searchValue || ""}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="cyber-input h-9 pl-9 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Filter Groups */}
            <div className="max-h-[60vh] overflow-y-auto px-5 pb-5 space-y-5">
              {groups.map((group) => (
                <FilterGroupSection
                  key={group.key}
                  group={group}
                  value={values[group.key]}
                  onChange={(val) => onChange(group.key, val)}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-accent-primary/8 px-5 py-4 flex gap-3">
              <button
                onClick={onReset}
                className="btn-secondary flex-1 justify-center text-sm py-2.5"
              >
                <RotateCcw size={14} />
                Clear All
              </button>
              <button
                onClick={onClose}
                className="btn-cyber flex-1 justify-center text-sm py-2.5"
              >
                <Check size={14} />
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ───── Filter Group Section ───── */
function FilterGroupSection({
  group,
  value,
  onChange,
}: {
  group: FilterGroup;
  value: string | string[] | undefined;
  onChange: (val: string | string[]) => void;
}) {
  const type = group.type || "single";
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (optionId: string) => {
    if (type === "single") {
      onChange(optionId === value ? "" : optionId);
    } else {
      const isSelected = selectedValues.includes(optionId);
      if (isSelected) {
        onChange(selectedValues.filter((v) => v !== optionId));
      } else {
        onChange([...selectedValues, optionId]);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        {group.icon && (
          <span className="text-content-tertiary">{group.icon}</span>
        )}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">
          {group.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {group.options.map((option) => {
          const isSelected = selectedValues.includes(option.id);
          return (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect(option.id)}
              className={`group relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-accent-primary/15 text-accent-primary border border-accent-primary/30 shadow-[0_0_12px_rgba(52,211,153,0.1)]"
                  : "bg-surface-secondary text-content-secondary border border-transparent hover:bg-surface-tertiary hover:text-content-primary"
              }`}
            >
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-primary"
                >
                  <Check size={8} className="text-white" />
                </motion.span>
              )}
              {option.label}
              {option.count !== undefined && (
                <span
                  className={`ml-0.5 text-[10px] ${isSelected ? "text-accent-primary/70" : "opacity-50"}`}
                >
                  {option.count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
