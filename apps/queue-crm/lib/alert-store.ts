import { create } from "zustand";

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  duration?: number; // ms, default 5000, 0 = persistent
}

interface AlertState {
  alerts: AlertItem[];
  addAlert: (alert: Omit<AlertItem, "id">) => string;
  removeAlert: (id: string) => void;
  clearAll: () => void;
}

let _counter = 0;

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],

  addAlert: (alert) => {
    const id = `alert-${++_counter}-${Date.now()}`;
    set((state) => ({
      alerts: [...state.alerts, { ...alert, id }],
    }));

    // Auto-remove after duration
    const duration = alert.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        }));
      }, duration);
    }

    return id;
  },

  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),

  clearAll: () => set({ alerts: [] }),
}));

/* ─── Convenience helpers (can be used outside React components) ─── */
export const alert = {
  success: (title: string, message?: string, duration?: number) =>
    useAlertStore
      .getState()
      .addAlert({ type: "success", title, message, duration }),
  error: (title: string, message?: string, duration?: number) =>
    useAlertStore
      .getState()
      .addAlert({ type: "error", title, message, duration }),
  warning: (title: string, message?: string, duration?: number) =>
    useAlertStore
      .getState()
      .addAlert({ type: "warning", title, message, duration }),
  info: (title: string, message?: string, duration?: number) =>
    useAlertStore
      .getState()
      .addAlert({ type: "info", title, message, duration }),
};
