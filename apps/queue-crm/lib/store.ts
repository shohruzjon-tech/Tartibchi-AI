"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";

interface AuthUser {
  userId: string;
  email?: string;
  phone?: string;
  role: string;
  tenantId?: string;
  branchId?: string;
  firstName: string;
  lastName: string;
  tenantMode?: string | null;
  onboardingCompleted?: boolean;
  workspaceName?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    user: any;
  }) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  updateTokens: (data: { accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (data) =>
        set({
          token: data.accessToken,
          refreshToken: data.refreshToken,
          user: {
            userId: data.user.id || data.user.userId,
            email: data.user.email || undefined,
            phone: data.user.phone || undefined,
            role: data.user.role,
            tenantId: data.user.tenantId,
            branchId: data.user.branchId,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            tenantMode: data.user.tenantMode || null,
            onboardingCompleted: data.user.onboardingCompleted || false,
            workspaceName:
              data.user.workspaceName || data.user.tenantName || undefined,
          },
        }),
      clearAuth: () => set({ token: null, refreshToken: null, user: null }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
      updateTokens: (data) =>
        set({
          token: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      isAuthenticated: () => !!get().token,
    }),
    { name: "queue-auth" },
  ),
);

/**
 * Hook to detect when zustand persist has finished hydrating from localStorage.
 * Uses useEffect (client-only) instead of onRehydrateStorage to avoid TDZ issues.
 * By the time useEffect fires, persist has already merged localStorage data into the store.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

interface TicketState {
  activeTicket: {
    id: string;
    publicId: string;
    displayNumber: string;
    queueId: string;
    status: string;
    position?: number;
    estimatedWait?: number;
  } | null;
  setActiveTicket: (ticket: any) => void;
  clearActiveTicket: () => void;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set) => ({
      activeTicket: null,
      setActiveTicket: (ticket) => set({ activeTicket: ticket }),
      clearActiveTicket: () => set({ activeTicket: null }),
    }),
    { name: "queue-ticket" },
  ),
);

// ─── Staff Auth Store ───

interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  counterId: string;
  counterName: string;
  counterNumber?: number;
  tenantId: string;
  branchId: string;
  role: string;
  type: string;
}

interface StaffAuthState {
  token: string | null;
  refreshToken: string | null;
  staff: StaffUser | null;
  selectionToken: string | null;
  pendingCounters: any[] | null;
  setStaffAuth: (data: {
    accessToken: string;
    refreshToken: string;
    user: any;
  }) => void;
  setPendingSelection: (data: {
    selectionToken: string;
    counters: any[];
  }) => void;
  clearPendingSelection: () => void;
  updateStaffTokens: (data: {
    accessToken: string;
    refreshToken: string;
  }) => void;
  clearStaffAuth: () => void;
  isStaffAuthenticated: () => boolean;
}

export const useStaffStore = create<StaffAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      staff: null,
      selectionToken: null,
      pendingCounters: null,
      setStaffAuth: (data) =>
        set({
          token: data.accessToken,
          refreshToken: data.refreshToken,
          staff: {
            id: data.user.id || data.user.userId,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email || "",
            phone: data.user.phone || "",
            counterId: data.user.counterId,
            counterName: data.user.counterName,
            counterNumber: data.user.counterNumber,
            tenantId: data.user.tenantId,
            branchId: data.user.branchId,
            role: data.user.role,
            type: data.user.type || "staff",
          },
          selectionToken: null,
          pendingCounters: null,
        }),
      setPendingSelection: (data) =>
        set({
          selectionToken: data.selectionToken,
          pendingCounters: data.counters,
          token: null,
          refreshToken: null,
          staff: null,
        }),
      clearPendingSelection: () =>
        set({ selectionToken: null, pendingCounters: null }),
      updateStaffTokens: (data) =>
        set({ token: data.accessToken, refreshToken: data.refreshToken }),
      clearStaffAuth: () =>
        set({
          token: null,
          refreshToken: null,
          staff: null,
          selectionToken: null,
          pendingCounters: null,
        }),
      isStaffAuthenticated: () => !!get().token && !!get().staff,
    }),
    { name: "queue-staff-auth" },
  ),
);
