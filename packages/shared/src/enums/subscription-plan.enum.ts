export enum SubscriptionPlan {
  BASIC = "BASIC",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export const PLAN_LIMITS = {
  [SubscriptionPlan.BASIC]: {
    maxBranches: 1,
    maxCounters: 2,
    maxQueues: 3,
    smsIncluded: 100,
    analytics: false,
    telegramBot: true,
    tvDisplay: false,
    apiAccess: false,
  },
  [SubscriptionPlan.PRO]: {
    maxBranches: 5,
    maxCounters: 10,
    maxQueues: 10,
    smsIncluded: 500,
    analytics: true,
    telegramBot: true,
    tvDisplay: true,
    apiAccess: false,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxBranches: -1, // unlimited
    maxCounters: -1,
    maxQueues: -1,
    smsIncluded: 2000,
    analytics: true,
    telegramBot: true,
    tvDisplay: true,
    apiAccess: true,
  },
} as const;
