import { Config } from "@/src/config";
import { store } from "@/src/store";
import { clearAuth, updateTokens } from "@/src/store/slices/authSlice";
import {
  clearStaffAuth,
  updateStaffTokens,
} from "@/src/store/slices/staffSlice";
import { SecureStorage } from "@/src/services/secure-storage";
import { router } from "expo-router";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  token?: string;
  _isRetry?: boolean;
  _useStaffRefresh?: boolean;
  isFormData?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;
let staffRefreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const state = store.getState().auth;
      const refreshToken = state.refreshToken;

      if (!refreshToken) {
        store.dispatch(clearAuth());
        await SecureStorage.clearTokens();
        return null;
      }

      const response = await fetch(`${Config.API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        store.dispatch(clearAuth());
        await SecureStorage.clearTokens();
        router.replace("/(auth)/login");
        return null;
      }

      const data = await response.json();
      store.dispatch(
        updateTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );
      await SecureStorage.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      store.dispatch(clearAuth());
      await SecureStorage.clearTokens();
      router.replace("/(auth)/login");
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function refreshStaffAccessToken(): Promise<string | null> {
  if (staffRefreshPromise) return staffRefreshPromise;

  staffRefreshPromise = (async () => {
    try {
      const state = store.getState().staff;
      const refreshToken = state.refreshToken;

      if (!refreshToken) {
        store.dispatch(clearStaffAuth());
        await SecureStorage.clearStaffTokens();
        return null;
      }

      const response = await fetch(`${Config.API_URL}/staff/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        store.dispatch(clearStaffAuth());
        await SecureStorage.clearStaffTokens();
        router.replace("/(auth)/staff-login");
        return null;
      }

      const data = await response.json();
      store.dispatch(
        updateStaffTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );
      await SecureStorage.setStaffTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      store.dispatch(clearStaffAuth());
      await SecureStorage.clearStaffTokens();
      router.replace("/(auth)/staff-login");
      return null;
    } finally {
      staffRefreshPromise = null;
    }
  })();

  return staffRefreshPromise;
}

async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    token,
    _isRetry,
    isFormData,
  } = options;

  const config: RequestInit = {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${Config.API_URL}${endpoint}`, config);

  if (response.status === 401 && token && !_isRetry) {
    const newToken = options._useStaffRefresh
      ? await refreshStaffAccessToken()
      : await refreshAccessToken();
    if (newToken) {
      return request<T>(endpoint, {
        ...options,
        token: newToken,
        _isRetry: true,
      });
    }
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Public API Client ──────────────────────────────────────────────
export const api = {
  // ─── Auth ──────────────────────────────────────────────
  auth: {
    register: (data: any) =>
      request("/auth/register", { method: "POST", body: data }),
    refresh: (refreshToken: string) =>
      request("/auth/refresh", { method: "POST", body: { refreshToken } }),
    requestOtp: (data: { phone: string }) =>
      request("/auth/request-otp", { method: "POST", body: data }),
    verifyOtp: (data: { phone: string; code: string }) =>
      request("/auth/verify-otp", { method: "POST", body: data }),
    loginWithOtp: (data: { phone: string; code: string }) =>
      request("/auth/login-otp", { method: "POST", body: data }),
    selectWorkspace: (data: { workspaceId: string }, sessionToken: string) =>
      request("/auth/select-workspace", {
        method: "POST",
        body: data,
        token: sessionToken,
      }),
    selectRole: (
      data: { role: string; workspaceId: string },
      sessionToken: string,
    ) =>
      request("/auth/select-role", {
        method: "POST",
        body: data,
        token: sessionToken,
      }),
  },

  // ─── Tenants ───────────────────────────────────────────
  tenants: {
    get: (id: string, token: string) => request(`/tenants/${id}`, { token }),
    update: (id: string, data: any, token: string) =>
      request(`/tenants/${id}`, { method: "PATCH", body: data, token }),
    switchMode: (
      data: { mode: string; soloProfile?: any; workingHours?: any },
      token: string,
    ) => request("/tenants/switch-mode", { method: "POST", body: data, token }),
  },

  // ─── Branches ──────────────────────────────────────────
  branches: {
    list: (tenantId: string, token: string) =>
      request(`/branches?tenantId=${tenantId}`, { token }),
    get: (id: string, token: string) => request(`/branches/${id}`, { token }),
    getBySlug: (slug: string) => request(`/branches/slug/${slug}`),
    create: (data: any, token: string) =>
      request("/branches", { method: "POST", body: data, token }),
    update: (id: string, data: any, token: string) =>
      request(`/branches/${id}`, { method: "PATCH", body: data, token }),
    delete: (id: string, token: string) =>
      request(`/branches/${id}`, { method: "DELETE", token }),
  },

  // ─── Queues/Services ──────────────────────────────────
  queues: {
    list: (params: { tenantId?: string; branchId?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return request(`/queues?${qs}`);
    },
    get: (id: string) => request(`/queues/${id}`),
    create: (data: any, token: string) =>
      request("/queues", { method: "POST", body: data, token }),
    update: (id: string, data: any, token: string) =>
      request(`/queues/${id}`, { method: "PATCH", body: data, token }),
    delete: (id: string, token: string) =>
      request(`/queues/${id}`, { method: "DELETE", token }),
    liveStatus: (id: string, tenantId: string, branchId: string) =>
      request(`/queues/${id}/live?tenantId=${tenantId}&branchId=${branchId}`),
  },

  // ─── Tickets ───────────────────────────────────────────
  tickets: {
    create: (data: any) => request("/tickets", { method: "POST", body: data }),
    get: (id: string) => request(`/tickets/${id}`),
    status: (publicId: string) => request(`/tickets/status/${publicId}`),
    queueTickets: (queueId: string, tenantId: string, branchId: string) =>
      request(
        `/tickets/queue/${queueId}?tenantId=${tenantId}&branchId=${branchId}`,
      ),
    estimatedWait: (publicId: string) => request(`/tickets/wait/${publicId}`),
    checkCustomer: (phone: string, tenantId: string) =>
      request(
        `/tickets/check-customer?phone=${encodeURIComponent(phone)}&tenantId=${tenantId}`,
      ),
  },

  // ─── Counters ──────────────────────────────────────────
  counters: {
    list: (params: { tenantId?: string; branchId?: string }, token: string) => {
      const qs = new URLSearchParams(params as any).toString();
      return request(`/counters?${qs}`, { token });
    },
    get: (id: string, token: string) => request(`/counters/${id}`, { token }),
    create: (data: any, token: string) =>
      request("/counters", { method: "POST", body: data, token }),
    update: (id: string, data: any, token: string) =>
      request(`/counters/${id}`, { method: "PATCH", body: data, token }),
    delete: (id: string, token: string) =>
      request(`/counters/${id}`, { method: "DELETE", token }),
    next: (id: string, token: string) =>
      request(`/counters/${id}/next`, { method: "POST", token }),
    recall: (id: string, token: string) =>
      request(`/counters/${id}/recall`, { method: "POST", token }),
    skip: (id: string, token: string) =>
      request(`/counters/${id}/skip`, { method: "POST", token }),
    startServing: (id: string, token: string) =>
      request(`/counters/${id}/start`, { method: "POST", token }),
    done: (id: string, token: string) =>
      request(`/counters/${id}/done`, { method: "POST", token }),
    transfer: (id: string, targetQueueId: string, token: string) =>
      request(`/counters/${id}/transfer`, {
        method: "POST",
        body: { targetQueueId },
        token,
      }),
  },

  // ─── Analytics ─────────────────────────────────────────
  analytics: {
    daily: (params: any, token: string) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/analytics/daily?${qs}`, { token });
    },
    queues: (params: any, token: string) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/analytics/queues?${qs}`, { token });
    },
    counters: (params: any, token: string) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/analytics/counters?${qs}`, { token });
    },
    branch: (params: any, token: string) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/analytics/branch?${qs}`, { token });
    },
    peakHours: (params: any, token: string) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/analytics/peak-hours?${qs}`, { token });
    },
    dashboardSummary: (
      params: { branchId?: string; startDate?: string; endDate?: string },
      token: string,
    ) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as any,
      ).toString();
      return request(`/analytics/dashboard-summary?${qs}`, { token });
    },
    employeePerformance: (params: any, token: string) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/analytics/employee-performance?${qs}`, { token });
    },
  },

  // ─── Telegram ──────────────────────────────────────────
  telegram: {
    registerBot: (botToken: string, token: string) =>
      request("/telegram/bot", { method: "POST", body: { botToken }, token }),
    unregisterBot: (token: string) =>
      request("/telegram/bot", { method: "DELETE", token }),
    getBotStatus: (token: string) => request("/telegram/bot/status", { token }),
    startBot: (token: string) =>
      request("/telegram/bot/start", { method: "POST", token }),
    stopBot: (token: string) =>
      request("/telegram/bot/stop", { method: "POST", token }),
    restartBot: (token: string) =>
      request("/telegram/bot/restart", { method: "POST", token }),
    deleteBot: (token: string) =>
      request("/telegram/bot/delete", { method: "DELETE", token }),
    getBotStats: (token: string) => request("/telegram/bot/stats", { token }),
  },

  // ─── Employees ─────────────────────────────────────────
  employees: {
    list: (params: { tenantId?: string; branchId?: string }, token: string) => {
      const qs = new URLSearchParams(params as any).toString();
      return request(`/users?${qs}`, { token });
    },
    get: (id: string, token: string) => request(`/users/${id}`, { token }),
    create: (data: any, token: string) =>
      request("/users", { method: "POST", body: data, token }),
    update: (id: string, data: any, token: string) =>
      request(`/users/${id}`, { method: "PATCH", body: data, token }),
  },

  // ─── Onboarding ────────────────────────────────────────
  onboarding: {
    complete: (data: { mode: string; soloProfile?: any }, token: string) =>
      request("/tenants/onboarding", { method: "POST", body: data, token }),
  },

  // ─── Appointments ──────────────────────────────────────
  appointments: {
    list: (params: { date?: string; status?: string }, token: string) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as any,
      ).toString();
      return request(`/appointments${qs ? `?${qs}` : ""}`, { token });
    },
    getDaily: (date: string, token: string) =>
      request(`/appointments/daily/${date}`, { token }),
    getSlots: (date: string, token: string) =>
      request(`/appointments/slots/${date}`, { token }),
    get: (id: string, token: string) =>
      request(`/appointments/${id}`, { token }),
    create: (data: any, token: string) =>
      request("/appointments", { method: "POST", body: data, token }),
    update: (id: string, data: any, token: string) =>
      request(`/appointments/${id}`, { method: "PATCH", body: data, token }),
    cancel: (id: string, token: string) =>
      request(`/appointments/${id}`, { method: "DELETE", token }),
  },

  // ─── AI ────────────────────────────────────────────────
  ai: {
    suggest: (data: { prompt: string; context?: any }, token: string) =>
      request("/ai/suggest", { method: "POST", body: data, token }),
    optimizeSchedule: (date: string, token: string) =>
      request(`/ai/optimize/${date}`, { method: "POST", token }),
    dashboardInsights: (analyticsData: any, token: string) =>
      request("/ai/dashboard-insights", {
        method: "POST",
        body: { analyticsData },
        token,
      }),
  },

  // ─── Customers ─────────────────────────────────────────
  customers: {
    list: (params: { search?: string }, token: string) => {
      const qs = params.search
        ? `?search=${encodeURIComponent(params.search)}`
        : "";
      return request(`/customers${qs}`, { token });
    },
    get: (id: string, token: string) => request(`/customers/${id}`, { token }),
    create: (data: any, token: string) =>
      request("/customers", { method: "POST", body: data, token }),
    update: (id: string, data: any, token: string) =>
      request(`/customers/${id}`, { method: "PATCH", body: data, token }),
    delete: (id: string, token: string) =>
      request(`/customers/${id}`, { method: "DELETE", token }),
    findByPhone: (phone: string, token: string) =>
      request(`/customers/by-phone/${encodeURIComponent(phone)}`, { token }),
    findOrCreate: (
      data: { phone: string; firstName?: string; lastName?: string },
      token: string,
    ) =>
      request("/customers/find-or-create", {
        method: "POST",
        body: data,
        token,
      }),
  },

  // ─── Staff Auth ────────────────────────────────────────
  staffAuth: {
    login: (data: { login: string; passcode: string }) =>
      request("/staff/auth/login", { method: "POST", body: data }),
    selectCounter: (data: { selectionToken: string; counterId: string }) =>
      request("/staff/auth/select-counter", { method: "POST", body: data }),
    refresh: (refreshToken: string) =>
      request("/staff/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      }),
  },

  // ─── Staff Counter ────────────────────────────────────
  staffCounter: {
    get: (id: string) => {
      const token = store.getState().staff.token;
      return request(`/counters/${id}`, {
        token: token!,
        _useStaffRefresh: true,
      });
    },
    next: (id: string) => {
      const token = store.getState().staff.token;
      return request(`/counters/${id}/next`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    recall: (id: string) => {
      const token = store.getState().staff.token;
      return request(`/counters/${id}/recall`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    skip: (id: string) => {
      const token = store.getState().staff.token;
      return request(`/counters/${id}/skip`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    startServing: (id: string) => {
      const token = store.getState().staff.token;
      return request(`/counters/${id}/start`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    done: (id: string) => {
      const token = store.getState().staff.token;
      return request(`/counters/${id}/done`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    transfer: (id: string, targetQueueId: string) => {
      const token = store.getState().staff.token;
      return request(`/counters/${id}/transfer`, {
        method: "POST",
        body: { targetQueueId },
        token: token!,
        _useStaffRefresh: true,
      });
    },
  },
};
