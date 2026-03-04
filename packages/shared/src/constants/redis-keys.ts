export const REDIS_KEYS = {
  /** Active queue list: FIFO list of ticket IDs */
  queue: (tenantId: string, branchId: string, queueId: string) =>
    `queue:${tenantId}:${branchId}:${queueId}`,

  /** Priority queue: sorted set of ticket IDs */
  priorityQueue: (tenantId: string, branchId: string, queueId: string) =>
    `pqueue:${tenantId}:${branchId}:${queueId}`,

  /** Ticket metadata hash */
  ticketMeta: (ticketId: string) => `ticket:meta:${ticketId}`,

  /** Counter current state */
  counter: (tenantId: string, branchId: string, counterId: string) =>
    `counter:${tenantId}:${branchId}:${counterId}`,

  /** Distributed lock for ticket operations */
  lock: (ticketId: string) => `lock:${ticketId}`,

  /** Distributed lock for counter operations */
  counterLock: (counterId: string) => `lock:counter:${counterId}`,

  /** Auto-incrementing ticket number per queue per day */
  ticketCounter: (
    tenantId: string,
    branchId: string,
    queueId: string,
    date: string,
  ) => `ticket:counter:${tenantId}:${branchId}:${queueId}:${date}`,

  /** Rolling average service time stats */
  queueStats: (tenantId: string, branchId: string, queueId: string) =>
    `stats:${tenantId}:${branchId}:${queueId}`,

  /** Daily counters */
  dailyCounter: (tenantId: string, branchId: string, date: string) =>
    `daily:${tenantId}:${branchId}:${date}`,

  /** Branch live channel for WebSocket pub/sub */
  branchLive: (branchId: string) => `branch:${branchId}:live`,

  /** Active counters count per queue */
  activeCounters: (tenantId: string, branchId: string, queueId: string) =>
    `active:counters:${tenantId}:${branchId}:${queueId}`,
} as const;
