import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthUser, TenantMode, Workspace, WorkspaceRole } from "@/src/types";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  // OTP flow
  otpPhone: string | null;
  sessionToken: string | null;
  workspaces: Workspace[];
  roles: WorkspaceRole[];
  selectedWorkspaceId: string | null;
  // UI
  isLoading: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  otpPhone: null,
  sessionToken: null,
  workspaces: [],
  roles: [],
  selectedWorkspaceId: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(
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
      state.user = {
        userId: user.id || user.userId,
        email: user.email || undefined,
        phone: user.phone || undefined,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantMode: user.tenantMode || null,
        onboardingCompleted: user.onboardingCompleted || false,
        workspaceName: user.workspaceName || user.tenantName || undefined,
      };
      // Clear OTP flow data
      state.otpPhone = null;
      state.sessionToken = null;
      state.workspaces = [];
      state.roles = [];
      state.selectedWorkspaceId = null;
    },

    updateTokens(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      }>,
    ) {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },

    updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    setOtpPhone(state, action: PayloadAction<string>) {
      state.otpPhone = action.payload;
    },

    setSessionToken(state, action: PayloadAction<string>) {
      state.sessionToken = action.payload;
    },

    setWorkspaces(state, action: PayloadAction<Workspace[]>) {
      state.workspaces = action.payload;
    },

    setRoles(state, action: PayloadAction<WorkspaceRole[]>) {
      state.roles = action.payload;
    },

    setSelectedWorkspace(state, action: PayloadAction<string>) {
      state.selectedWorkspaceId = action.payload;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    clearAuth() {
      return initialState;
    },
  },
});

export const {
  setAuth,
  updateTokens,
  updateUser,
  setOtpPhone,
  setSessionToken,
  setWorkspaces,
  setRoles,
  setSelectedWorkspace,
  setLoading,
  clearAuth,
} = authSlice.actions;

export default authSlice.reducer;
