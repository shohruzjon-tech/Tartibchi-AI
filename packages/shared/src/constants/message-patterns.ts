export const AUTH_PATTERNS = {
  LOGIN: { cmd: "auth.login" },
  REGISTER: { cmd: "auth.register" },
  REFRESH: { cmd: "auth.refresh" },
  VALIDATE: { cmd: "auth.validate" },
  REQUEST_OTP: { cmd: "auth.requestOtp" },
  VERIFY_OTP: { cmd: "auth.verifyOtp" },
  LOGIN_WITH_OTP: { cmd: "auth.loginWithOtp" },
  SELECT_WORKSPACE: { cmd: "auth.selectWorkspace" },
  SELECT_ROLE: { cmd: "auth.selectRole" },
  STAFF_LOGIN: { cmd: "auth.staffLogin" },
  STAFF_SELECT_COUNTER: { cmd: "auth.staffSelectCounter" },
  STAFF_REFRESH: { cmd: "auth.staffRefresh" },
} as const;

export const TENANT_PATTERNS = {
  CREATE: { cmd: "tenant.create" },
  FIND_ONE: { cmd: "tenant.findOne" },
  FIND_ALL: { cmd: "tenant.findAll" },
  UPDATE: { cmd: "tenant.update" },
  SWITCH_MODE: { cmd: "tenant.switchMode" },
} as const;

export const BRANCH_PATTERNS = {
  CREATE: { cmd: "branch.create" },
  FIND_ONE: { cmd: "branch.findOne" },
  FIND_BY_SLUG: { cmd: "branch.findBySlug" },
  FIND_ALL: { cmd: "branch.findAll" },
  UPDATE: { cmd: "branch.update" },
  DELETE: { cmd: "branch.delete" },
} as const;

export const USER_PATTERNS = {
  CREATE: { cmd: "user.create" },
  FIND_ONE: { cmd: "user.findOne" },
  FIND_BY_EMAIL: { cmd: "user.findByEmail" },
  FIND_BY_PHONE: { cmd: "user.findByPhone" },
  FIND_ALL: { cmd: "user.findAll" },
  UPDATE: { cmd: "user.update" },
} as const;

export const QUEUE_PATTERNS = {
  CREATE: { cmd: "queue.create" },
  FIND_ONE: { cmd: "queue.findOne" },
  FIND_ALL: { cmd: "queue.findAll" },
  UPDATE: { cmd: "queue.update" },
  DELETE: { cmd: "queue.delete" },
  GET_LIVE_STATUS: { cmd: "queue.getLiveStatus" },
} as const;

export const TICKET_PATTERNS = {
  CREATE: { cmd: "ticket.create" },
  FIND_ONE: { cmd: "ticket.findOne" },
  GET_STATUS: { cmd: "ticket.getStatus" },
  GET_QUEUE_TICKETS: { cmd: "ticket.getQueueTickets" },
  GET_ESTIMATED_WAIT: { cmd: "ticket.getEstimatedWait" },
} as const;

export const COUNTER_PATTERNS = {
  CREATE: { cmd: "counter.create" },
  FIND_ONE: { cmd: "counter.findOne" },
  FIND_ALL: { cmd: "counter.findAll" },
  UPDATE: { cmd: "counter.update" },

  NEXT: { cmd: "counter.next" },
  RECALL: { cmd: "counter.recall" },
  SKIP: { cmd: "counter.skip" },
  START_SERVING: { cmd: "counter.startServing" },
  DONE: { cmd: "counter.done" },
  TRANSFER: { cmd: "counter.transfer" },
} as const;

export const NOTIFICATION_PATTERNS = {
  SEND_SMS: { cmd: "notification.sendSms" },
  SEND_TELEGRAM: { cmd: "notification.sendTelegram" },
  TICKET_APPROACHING: { cmd: "notification.ticketApproaching" },
} as const;

export const ANALYTICS_PATTERNS = {
  RECORD_EVENT: { cmd: "analytics.recordEvent" },
  DAILY_STATS: { cmd: "analytics.dailyStats" },
  QUEUE_STATS: { cmd: "analytics.queueStats" },
  COUNTER_STATS: { cmd: "analytics.counterStats" },
  BRANCH_STATS: { cmd: "analytics.branchStats" },
  PEAK_HOURS: { cmd: "analytics.peakHours" },
  DASHBOARD_SUMMARY: { cmd: "analytics.dashboardSummary" },
  EMPLOYEE_PERFORMANCE: { cmd: "analytics.employeePerformance" },
} as const;

export const TELEGRAM_PATTERNS = {
  REGISTER_BOT: { cmd: "telegram.registerBot" },
  UNREGISTER_BOT: { cmd: "telegram.unregisterBot" },
  SEND_MESSAGE: { cmd: "telegram.sendMessage" },
  LINK_USER: { cmd: "telegram.linkUser" },
  GET_BOT_STATUS: { cmd: "telegram.getBotStatus" },
  START_BOT: { cmd: "telegram.startBot" },
  STOP_BOT: { cmd: "telegram.stopBot" },
  RESTART_BOT: { cmd: "telegram.restartBot" },
  DELETE_BOT: { cmd: "telegram.deleteBot" },
  GET_BOT_STATS: { cmd: "telegram.getBotStats" },
} as const;

export const WEBSOCKET_PATTERNS = {
  EMIT_QUEUE_UPDATE: { cmd: "ws.emitQueueUpdate" },
  EMIT_TICKET_CALLED: { cmd: "ws.emitTicketCalled" },
  EMIT_DISPLAY_UPDATE: { cmd: "ws.emitDisplayUpdate" },
  EMIT_COUNTER_UPDATE: { cmd: "ws.emitCounterUpdate" },
} as const;

export const DOCUMENT_PATTERNS = {
  CREATE: { cmd: "document.create" },
  FIND_BY_USER: { cmd: "document.findByUser" },
  DELETE: { cmd: "document.delete" },
} as const;

export const APPOINTMENT_PATTERNS = {
  CREATE: { cmd: "appointment.create" },
  FIND_ONE: { cmd: "appointment.findOne" },
  FIND_ALL: { cmd: "appointment.findAll" },
  UPDATE: { cmd: "appointment.update" },
  CANCEL: { cmd: "appointment.cancel" },
  GET_AVAILABLE_SLOTS: { cmd: "appointment.getAvailableSlots" },
  GET_DAILY: { cmd: "appointment.getDaily" },
} as const;

export const ONBOARDING_PATTERNS = {
  COMPLETE: { cmd: "onboarding.complete" },
} as const;

export const AI_PATTERNS = {
  SUGGEST: { cmd: "ai.suggest" },
  OPTIMIZE_SCHEDULE: { cmd: "ai.optimizeSchedule" },
  DASHBOARD_INSIGHTS: { cmd: "ai.dashboardInsights" },
} as const;

export const CUSTOMER_PATTERNS = {
  CREATE: { cmd: "customer.create" },
  FIND_ONE: { cmd: "customer.findOne" },
  FIND_BY_PHONE: { cmd: "customer.findByPhone" },
  FIND_ALL: { cmd: "customer.findAll" },
  UPDATE: { cmd: "customer.update" },
  DELETE: { cmd: "customer.delete" },
  FIND_OR_CREATE: { cmd: "customer.findOrCreate" },
  FIND_BY_TELEGRAM: { cmd: "customer.findByTelegram" },
} as const;
