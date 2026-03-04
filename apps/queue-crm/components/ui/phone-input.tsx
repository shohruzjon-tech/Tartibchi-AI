"use client";

import { useCallback } from "react";
import { Phone } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** If true, uses custom styling instead of input-field class */
  customStyle?: string;
}

const PREFIX = "+998";

function formatPhone(value: string, current: string): string {
  // Strip everything except digits and leading +
  const digits = value.replace(/[^\d+]/g, "");
  // Always enforce +998 prefix
  if (!digits.startsWith(PREFIX)) return PREFIX;
  // Max 13 chars: +998 + 9 digits
  if (digits.length > 13) return current;
  return digits;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "+998 XX XXX XX XX",
  required,
  className,
  customStyle,
}: PhoneInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(formatPhone(e.target.value, value));
    },
    [onChange, value],
  );

  // Ensure the displayed value always starts with +998
  const displayValue = value && value.startsWith(PREFIX) ? value : PREFIX;

  return (
    <div className="relative">
      <Phone
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary"
      />
      <input
        type="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={customStyle || `input-field w-full pl-9 ${className || ""}`}
        autoComplete="tel"
      />
    </div>
  );
}
