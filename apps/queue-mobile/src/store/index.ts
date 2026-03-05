import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import authReducer from "./slices/authSlice";
import staffReducer from "./slices/staffSlice";
import ticketReducer from "./slices/ticketSlice";
import alertReducer from "./slices/alertSlice";
import settingsReducer from "./slices/settingsSlice";

// ─── Persist Config ──────────────────────────────────────────────────
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "staff", "ticket", "settings"],
  blacklist: ["alerts"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  staff: staffReducer,
  ticket: ticketReducer,
  alerts: alertReducer,
  settings: settingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ─── Logger Middleware (dev only) ────────────────────────────────────
const middlewares: any[] = [];

if (__DEV__) {
  const { createLogger } = require("redux-logger");
  middlewares.push(
    createLogger({
      collapsed: true,
      duration: true,
      diff: true,
      predicate: (_: any, action: any) => !action.type?.startsWith("persist/"),
    }),
  );
}

// ─── Store ───────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(middlewares),
});

export const persistor = persistStore(store);

// ─── Types ───────────────────────────────────────────────────────────
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// ─── Hooks ───────────────────────────────────────────────────────────
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
