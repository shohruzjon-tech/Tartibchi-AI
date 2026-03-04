"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;

  const modes = [
    { key: "light", icon: Sun, label: "Light" },
    { key: "dark", icon: Moon, label: "Dark" },
    { key: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-surface-secondary/60 p-1 backdrop-blur-sm">
      {modes.map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`rounded-lg p-1.5 transition-all duration-300 ${
            theme === key
              ? "bg-white text-accent-primary shadow-sm dark:bg-white/10"
              : "text-content-tertiary hover:text-content-primary"
          }`}
          aria-label={key}
        >
          <Icon size={16} strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}
