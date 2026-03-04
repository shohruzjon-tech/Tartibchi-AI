"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  autoFocus,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const digits = value
    .split("")
    .concat(Array(length).fill(""))
    .slice(0, length);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^\d?$/.test(char)) return;
      const newDigits = [...digits];
      newDigits[index] = char;
      const newValue = newDigits.join("").trim();
      onChange(newValue);
      if (char && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, onChange, length],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join("").trim());
      }
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, onChange, length],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    },
    [onChange, length],
  );

  const filledCount = value.replace(/\s/g, "").length;
  const progress = filledCount / length;

  return (
    <div className="space-y-4">
      {/* OTP Input Cells */}
      <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
        {Array.from({ length }, (_, i) => {
          const isFilled = !!digits[i];
          const isFocused = focusedIndex === i;
          const isNext = i === filledCount && !isFilled;

          return (
            <div key={i} className="relative">
              <motion.input
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digits[i] || ""}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(-1)}
                disabled={disabled}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, type: "spring", bounce: 0.3 }}
                className={clsx(
                  "relative z-10 w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl",
                  "border-2 transition-all duration-300 font-mono outline-none",
                  "bg-surface-primary/60 backdrop-blur-sm",
                  isFocused &&
                    "border-accent-primary ring-4 ring-accent-primary/15 bg-surface-elevated scale-105",
                  isFilled &&
                    !isFocused &&
                    "border-accent-primary/40 bg-accent-primary/5 text-accent-primary",
                  !isFilled &&
                    !isFocused &&
                    "border-surface-tertiary/60 text-content-primary",
                  isNext &&
                    !isFocused &&
                    "border-accent-primary/20 animate-pulse",
                  disabled && "opacity-40 cursor-not-allowed",
                )}
              />

              {/* Glow effect on filled */}
              {isFilled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 -z-10 rounded-2xl bg-accent-primary/10 blur-md"
                />
              )}

              {/* Bottom accent line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isFilled || isFocused ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full",
                  isFocused ? "bg-accent-primary" : "bg-accent-primary/40",
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1.5">
          {Array.from({ length }, (_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                backgroundColor:
                  i < filledCount
                    ? "var(--color-accent-primary)"
                    : "var(--color-surface-tertiary)",
              }}
              transition={{ delay: 0.05 * i, duration: 0.2 }}
              className="h-1 w-1 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
