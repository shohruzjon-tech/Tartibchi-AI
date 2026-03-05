import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StaffUser } from "@/src/types";

interface StaffState {
  token: string | null;
  refreshToken: string | null;
  staff: StaffUser | null;
  selectionToken: string | null;
  pendingCounters: any[] | null;
}

const initialState: StaffState = {
  token: null,
  refreshToken: null,
  staff: null,
  selectionToken: null,
  pendingCounters: null,
};

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    setStaffAuth(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>,
    ) {
      const { accessToken, refreshToken, user } = action.payload;
      state.token = accessToken;
      state.refreshToken = refreshToken;
      state.staff = {
        id: user.id || user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || "",
        phone: user.phone || "",
        counterId: user.counterId,
        counterName: user.counterName,
        counterNumber: user.counterNumber,
        tenantId: user.tenantId,
        branchId: user.branchId,
        role: user.role,
        type: user.type || "staff",
      };
      state.selectionToken = null;
      state.pendingCounters = null;
    },

    setPendingSelection(
      state,
      action: PayloadAction<{
        selectionToken: string;
        counters: any[];
      }>,
    ) {
      state.selectionToken = action.payload.selectionToken;
      state.pendingCounters = action.payload.counters;
      state.token = null;
      state.refreshToken = null;
      state.staff = null;
    },

    clearPendingSelection(state) {
      state.selectionToken = null;
      state.pendingCounters = null;
    },

    updateStaffTokens(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      }>,
    ) {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },

    clearStaffAuth() {
      return initialState;
    },
  },
});

export const {
  setStaffAuth,
  setPendingSelection,
  clearPendingSelection,
  updateStaffTokens,
  clearStaffAuth,
} = staffSlice.actions;

export default staffSlice.reducer;
