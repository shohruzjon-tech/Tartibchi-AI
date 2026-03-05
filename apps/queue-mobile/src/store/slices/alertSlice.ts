import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  duration?: number;
}

interface AlertState {
  alerts: AlertItem[];
}

const initialState: AlertState = {
  alerts: [],
};

let _counter = 0;

const alertSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    addAlert(state, action: PayloadAction<Omit<AlertItem, "id">>) {
      const id = `alert-${++_counter}-${Date.now()}`;
      state.alerts.push({ ...action.payload, id });
    },
    removeAlert(state, action: PayloadAction<string>) {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
    clearAlerts(state) {
      state.alerts = [];
    },
  },
});

export const { addAlert, removeAlert, clearAlerts } = alertSlice.actions;
export default alertSlice.reducer;
