// ─── Enums ───────────────────────────────────────────────────────────
export enum TicketStatus {
  CREATED = "CREATED",
  WAITING = "WAITING",
  CALLED = "CALLED",
  SERVING = "SERVING",
  DONE = "DONE",
  SKIPPED = "SKIPPED",
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  TENANT_ADMIN = "TENANT_ADMIN",
  BRANCH_MANAGER = "BRANCH_MANAGER",
  STAFF = "STAFF",
}

export enum QueueStrategy {
  FIFO = "FIFO",
  PRIORITY = "PRIORITY",
}

export enum SubscriptionPlan {
  BASIC = "BASIC",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export enum TicketEventType {
  CREATED = "CREATED",
  ENTERED_QUEUE = "ENTERED_QUEUE",
  CALLED = "CALLED",
  SERVING_STARTED = "SERVING_STARTED",
  COMPLETED = "COMPLETED",
  SKIPPED = "SKIPPED",
  RECALLED = "RECALLED",
  TRANSFERRED = "TRANSFERRED",
}

export enum TenantMode {
  SOLO = "SOLO",
  MULTI = "MULTI",
}

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

// ─── Interfaces ─────────────────────────────────────────────────────
export interface ITenant {
  _id?: string;
  name: string;
  slug: string;
  mode?: TenantMode;
  onboardingCompleted: boolean;
  subscriptionPlan: SubscriptionPlan;
  isActive: boolean;
  telegramBotToken?: string;
  smsBalance: number;
  avgServiceTime: number;
  soloProfile?: ISoloProfile;
  createdAt: string;
  updatedAt: string;
}

export interface IBranch {
  _id?: string;
  tenantId: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  timezone: string;
  workingHours?: string;
  managerId?: string;
  managerName?: string;
  maxDailyTickets?: number;
  description?: string;
  serviceCategories?: string[];
  tags?: string[];
  languages?: string[];
  schedule?: Record<string, { start: string; end: string; closed?: boolean }>;
  avgTimePerClient?: number;
  coordinates?: { lat: number; lng: number };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IQueue {
  _id?: string;
  tenantId: string;
  branchId: string;
  name: string;
  prefix: string;
  strategy: QueueStrategy;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITicket {
  _id?: string;
  tenantId: string;
  branchId: string;
  queueId: string;
  publicId: string;
  number: number;
  displayNumber: string;
  status: TicketStatus;
  counterId?: string;
  customerPhone?: string;
  customerTelegramId?: string;
  priority: number;
  createdAt: string;
  calledAt?: string;
  servingStartedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface ICounter {
  _id?: string;
  tenantId: string;
  branchId: string;
  name: string;
  counterNumber?: number;
  description?: string;
  location?: string;
  floor?: string;
  languages?: string[];
  maxConcurrentTickets?: number;
  priority?: number;
  tags?: string[];
  queueIds: string[];
  isActive: boolean;
  currentTicketId?: string;
  staffId?: string;
  employeeId: string;
  login?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id?: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegramId?: string;
  role: UserRole;
  tenantId?: string;
  branchId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomer {
  _id?: string;
  phone: string;
  firstName: string;
  lastName?: string;
  tenantId: string;
  telegramId?: string;
  telegramChatId?: string;
  email?: string;
  totalVisits: number;
  lastVisitAt?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAppointment {
  _id?: string;
  tenantId: string;
  branchId?: string;
  customerName: string;
  customerPhone?: string;
  customerTelegramId?: string;
  service: string;
  date: string;
  timeSlot: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  earnings?: number;
  aiSuggestion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITimeSlot {
  time: string;
  available: boolean;
}

export interface ISoloProfile {
  businessType?: string;
  services?: string[];
  workingHours?: Record<
    string,
    { start: string; end: string; closed?: boolean }
  >;
  slotDuration?: number;
  breakBetweenSlots?: number;
  maxDailyAppointments?: number;
  address?: string;
  phone?: string;
  description?: string;
}

export interface ITelegramBot {
  _id?: string;
  tenantId: string;
  botToken: string;
  botUsername: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Auth Types ─────────────────────────────────────────────────────
export interface AuthUser {
  userId: string;
  email?: string;
  phone?: string;
  role: UserRole;
  tenantId?: string;
  branchId?: string;
  firstName: string;
  lastName: string;
  tenantMode?: TenantMode | null;
  onboardingCompleted?: boolean;
  workspaceName?: string;
}

export interface StaffUser {
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

export interface Workspace {
  id: string;
  name: string;
  mode?: TenantMode;
}

export interface WorkspaceRole {
  role: UserRole;
  branchId?: string;
  branchName?: string;
}
