"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X, Search } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  searchable?: boolean;
  footerAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
  emptyMessage?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  icon,
  searchable = true,
  footerAction,
  emptyMessage,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter((o) => value.includes(o.value));

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const remove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-content-secondary">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full min-h-[42px] items-center gap-2 rounded-xl bg-surface-secondary px-3 py-2 text-sm transition-all hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
      >
        {icon && <span className="shrink-0 text-content-tertiary">{icon}</span>}
        <div className="flex flex-1 flex-wrap gap-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-content-tertiary py-0.5">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-lg bg-accent-primary/10 px-2 py-0.5 text-xs font-medium text-accent-primary"
              >
                <span className="truncate max-w-[120px]">{opt.label}</span>
                <button
                  type="button"
                  onClick={(e) => remove(opt.value, e)}
                  className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-accent-primary/20"
                >
                  <X size={10} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-content-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl bg-surface-elevated p-1 shadow-large"
          >
            {/* Search */}
            {searchable && (
              <div className="relative mb-1 px-1">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg bg-surface-secondary py-2 pl-8 pr-3 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none"
                />
              </div>
            )}

            <div className="max-h-[200px] overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-content-tertiary">
                  {emptyMessage || "No options found"}
                </p>
              )}
              {filtered.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-accent-primary/10 text-accent-primary"
                        : "text-content-primary hover:bg-surface-secondary"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                        isSelected
                          ? "border-accent-primary bg-accent-primary"
                          : "border-content-tertiary/40 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    {option.icon && (
                      <span className="shrink-0">{option.icon}</span>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <span className="font-medium truncate block">
                        {option.label}
                      </span>
                      {option.description && (
                        <p className="text-xs text-content-tertiary truncate">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {footerAction && (
              <>
                <div className="mx-1 border-t border-surface-tertiary/60" />
                <button
                  type="button"
                  onClick={() => {
                    footerAction.onClick();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/8"
                >
                  {footerAction.icon}
                  {footerAction.label}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
