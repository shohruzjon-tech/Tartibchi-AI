"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, CheckCircle2, ClipboardList, X } from "lucide-react";
import { ResponsivePicker } from "./responsive-picker";

interface Service {
  _id: string;
  name: string;
  prefix?: string;
  isActive?: boolean;
}

interface ServicesPickerProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ServicesPicker({
  isOpen,
  onClose,
  services,
  selected,
  onSelectionChange,
}: ServicesPickerProps) {
  const tc = useTranslations("counters");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      services.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [services, search],
  );

  const toggle = (id: string) => {
    onSelectionChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  return (
    <ResponsivePicker
      isOpen={isOpen}
      onClose={onClose}
      title={tc("selectServices")}
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-content-tertiary">
          {tc("selectServicesDesc")}
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
            placeholder={tc("searchServices")}
          />
        </div>

        {/* List */}
        <div className="max-h-72 space-y-1.5 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((svc) => (
              <button
                key={svc._id}
                type="button"
                onClick={() => toggle(svc._id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  selected.includes(svc._id)
                    ? "bg-accent-primary/10 ring-2 ring-accent-primary"
                    : "bg-surface-secondary hover:bg-surface-tertiary"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    selected.includes(svc._id)
                      ? "bg-accent-primary text-white"
                      : "bg-surface-tertiary text-content-secondary"
                  }`}
                >
                  {svc.prefix || svc.name[0]}
                </div>
                <span className="flex-1 text-sm font-medium text-content-primary">
                  {svc.name}
                </span>
                {selected.includes(svc._id) && (
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-accent-primary"
                  />
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ClipboardList size={24} className="text-content-tertiary" />
              <p className="text-sm text-content-tertiary">
                {tc("noQueuesAvailable")}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-primary pt-4">
          <span className="text-xs text-content-tertiary">
            {tc("servicesCount", { count: selected.length })}
          </span>
          <button type="button" onClick={onClose} className="btn-primary">
            {tc("done")}
          </button>
        </div>
      </div>
    </ResponsivePicker>
  );
}

/** Inline trigger button for the services picker */
interface ServicesTriggerProps {
  selected: string[];
  services: Service[];
  onClick: () => void;
}

export function ServicesTrigger({
  selected,
  services,
  onClick,
}: ServicesTriggerProps) {
  const tc = useTranslations("counters");

  const selectedNames = services
    .filter((s) => selected.includes(s._id))
    .map((s) => s.name);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-content-secondary">
        {tc("selectServices")}
      </label>
      <button
        type="button"
        onClick={onClick}
        className="input-field flex w-full items-center gap-2 text-left"
      >
        <ClipboardList size={16} className="shrink-0 text-content-tertiary" />
        {selectedNames.length > 0 ? (
          <span className="flex-1 truncate text-sm text-content-primary">
            {selectedNames.join(", ")}
          </span>
        ) : (
          <span className="flex-1 text-sm text-content-tertiary">
            {tc("noServicesSelected")}
          </span>
        )}
        <span className="shrink-0 rounded-md bg-accent-primary/10 px-2 py-0.5 text-xs font-semibold text-accent-primary">
          {selected.length}
        </span>
      </button>
      {selectedNames.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-md bg-accent-primary/8 px-2 py-1 text-xs font-medium text-accent-primary"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
