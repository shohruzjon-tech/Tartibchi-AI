"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  required?: boolean;
  footerAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
  emptyMessage?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  icon,
  required,
  footerAction,
  emptyMessage,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        className="flex w-full items-center gap-3 rounded-xl bg-surface-secondary px-4 py-2.5 text-sm transition-all hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
      >
        {icon && <span className="text-content-tertiary">{icon}</span>}
        <span
          className={`flex-1 text-left ${selected ? "text-content-primary" : "text-content-tertiary"}`}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-content-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
            <div className="max-h-[200px] overflow-y-auto">
              {options.length === 0 && emptyMessage && (
                <p className="px-3 py-4 text-center text-xs text-content-tertiary">
                  {emptyMessage}
                </p>
              )}
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    value === option.value
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-content-primary hover:bg-surface-secondary"
                  }`}
                >
                  {option.icon && <span>{option.icon}</span>}
                  <div className="flex-1 text-left">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <p className="text-xs text-content-tertiary">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {value === option.value && (
                    <Check size={16} className="text-accent-primary" />
                  )}
                </button>
              ))}
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
