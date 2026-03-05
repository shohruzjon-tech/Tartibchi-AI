import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NotificationPreferences {
  pushEnabled: boolean;
  ticketCalled: boolean;
  ticketAlmostReady: boolean;
  appointmentReminder: boolean;
  queueUpdates: boolean;
  systemAlerts: boolean;
  sound: boolean;
  vibration: boolean;
}

interface SettingsState {
  language: "uz" | "ru" | "en";
  theme: "light" | "dark" | "system";
  notifications: NotificationPreferences;
  biometricEnabled: boolean;
}

const initialState: SettingsState = {
  language: "uz",
  theme: "system",
  notifications: {
    pushEnabled: true,
    ticketCalled: true,
    ticketAlmostReady: true,
    appointmentReminder: true,
    queueUpdates: true,
    systemAlerts: true,
    sound: true,
    vibration: true,
  },
  biometricEnabled: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<"uz" | "ru" | "en">) {
      state.language = action.payload;
    },
    setTheme(state, action: PayloadAction<"light" | "dark" | "system">) {
      state.theme = action.payload;
    },
    updateNotificationPref(
      state,
      action: PayloadAction<Partial<NotificationPreferences>>,
    ) {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    toggleBiometric(state) {
      state.biometricEnabled = !state.biometricEnabled;
    },
  },
});

export const {
  setLanguage,
  setTheme,
  updateNotificationPref,
  toggleBiometric,
} = settingsSlice.actions;
export default settingsSlice.reducer;
