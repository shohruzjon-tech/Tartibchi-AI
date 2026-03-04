"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface DropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (key: string) => void;
  align?: "left" | "right";
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  align = "right",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl bg-surface-elevated p-1 shadow-large ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {items.map((item) =>
              item.divider ? (
                <div key={item.key} className="my-1 h-px bg-surface-tertiary" />
              ) : (
                <button
                  key={item.key}
                  onClick={() => {
                    onSelect(item.key);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    item.danger
                      ? "text-status-error hover:bg-status-error/10"
                      : "text-content-primary hover:bg-surface-secondary"
                  }`}
                >
                  {item.icon && (
                    <span className="text-content-tertiary">{item.icon}</span>
                  )}
                  <div className="flex-1 text-left">
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <p className="text-xs text-content-tertiary">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
