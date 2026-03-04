const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  token?: string;
  _isRetry?: boolean;
  _useStaffRefresh?: boolean;
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Updates zustand store on success; clears auth and redirects on failure.
 */
let refreshPromise: Promise<string | null> | null = null;
let staffRefreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh calls
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // Dynamic import to avoid circular dependency
      const { useAuthStore } = await import("./store");
      const { refreshToken, clearAuth, updateTokens } = useAuthStore.getState();

      if (!refreshToken) {
        clearAuth();
        return null;
      }

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return null;
      }

      const data = await response.json();
      updateTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return data.accessToken;
    } catch {
      const { useAuthStore } = await import("./store");
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
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
      const { useStaffStore } = await import("./store");
      const { refreshToken, clearStaffAuth, updateStaffTokens } =
        useStaffStore.getState();

      if (!refreshToken) {
        clearStaffAuth();
        return null;
      }

      const response = await fetch(`${API_BASE}/staff/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearStaffAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/staff/login";
        }
        return null;
      }

      const data = await response.json();
      updateStaffTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return data.accessToken;
    } catch {
      const { useStaffStore } = await import("./store");
      useStaffStore.getState().clearStaffAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/staff/login";
      }
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
  const { method = "GET", body, headers = {}, token, _isRetry } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // Auto-refresh on 401 (only once, and only if we had a token)
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

export const api = {
  auth: {
    register: (data: any) =>
      request("/auth/register", { method: "POST", body: data }),
    refresh: (refreshToken: string) =>
      request("/auth/refresh", { method: "POST", body: { refreshToken } }),
    /** Request an OTP code to be sent to the given phone number */
    requestOtp: (data: { phone: string }) =>
      request("/auth/request-otp", { method: "POST", body: data }),
    /** Verify an OTP code (used during registration) */
    verifyOtp: (data: { phone: string; code: string }) =>
      request("/auth/verify-otp", { method: "POST", body: data }),
    /** Login with phone + OTP. Returns either tokens (single workspace/role) or workspaces list */
    loginWithOtp: (data: { phone: string; code: string }) =>
      request("/auth/login-otp", { method: "POST", body: data }),
    /** After phone OTP login — select which workspace to enter */
    selectWorkspace: (data: { workspaceId: string }, sessionToken: string) =>
      request("/auth/select-workspace", {
        method: "POST",
        body: data,
        token: sessionToken,
      }),
    /** After workspace selection — select which role to use */
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
  tenants: {
    get: (id: string, token: string) => request(`/tenants/${id}`, { token }),
    update: (id: string, data: any, token: string) =>
      request(`/tenants/${id}`, { method: "PATCH", body: data, token }),
    switchMode: (data: { mode: string; soloProfile?: any }, token: string) =>
      request("/tenants/switch-mode", { method: "POST", body: data, token }),
  },
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
  onboarding: {
    complete: (data: { mode: string; soloProfile?: any }, token: string) =>
      request("/tenants/onboarding", { method: "POST", body: data, token }),
  },
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
  documents: {
    upload: async (
      userId: string,
      file: File,
      category: string,
      token: string,
    ) => {
      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      let response = await fetch(
        `${API_BASE}/documents/upload/${userId}?category=${encodeURIComponent(category)}`,
        { method: "POST", headers, body: formData },
      );

      // Auto-refresh on 401
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(
            `${API_BASE}/documents/upload/${userId}?category=${encodeURIComponent(category)}`,
            { method: "POST", headers, body: formData },
          );
        } else {
          throw new Error("Session expired");
        }
      }

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      return response.json();
    },
    list: (userId: string, token: string) =>
      request(`/documents/user/${userId}`, { token }),
    delete: (id: string, token: string) =>
      request(`/documents/${id}`, { method: "DELETE", token }),
    getUrl: (fileName: string) =>
      `${API_BASE.replace("/api", "")}/uploads/${fileName}`,
  },
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

  /**
   * Staff-specific counter operations.
   * Auto-attaches the staff token from useStaffStore and uses
   * staff refresh on 401 — completely isolated from the admin session.
   */
  staffCounter: {
    _getToken: () => {
      // Dynamic import avoided: we inline-import at call time
      const { useStaffStore } = require("./store");
      return useStaffStore.getState().token as string | null;
    },
    get: (id: string) => {
      const token = api.staffCounter._getToken();
      return request(`/counters/${id}`, {
        token: token!,
        _useStaffRefresh: true,
      });
    },
    next: (id: string) => {
      const token = api.staffCounter._getToken();
      return request(`/counters/${id}/next`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    recall: (id: string) => {
      const token = api.staffCounter._getToken();
      return request(`/counters/${id}/recall`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    skip: (id: string) => {
      const token = api.staffCounter._getToken();
      return request(`/counters/${id}/skip`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    startServing: (id: string) => {
      const token = api.staffCounter._getToken();
      return request(`/counters/${id}/start`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    done: (id: string) => {
      const token = api.staffCounter._getToken();
      return request(`/counters/${id}/done`, {
        method: "POST",
        token: token!,
        _useStaffRefresh: true,
      });
    },
    transfer: (id: string, targetQueueId: string) => {
      const token = api.staffCounter._getToken();
      return request(`/counters/${id}/transfer`, {
        method: "POST",
        body: { targetQueueId },
        token: token!,
        _useStaffRefresh: true,
      });
    },
  },
};
