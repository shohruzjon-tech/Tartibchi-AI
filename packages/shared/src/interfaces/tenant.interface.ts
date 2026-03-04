import { SubscriptionPlan } from "../enums/subscription-plan.enum";
import { TenantMode } from "../enums/tenant-mode.enum";
import { ISoloProfile } from "./appointment.interface";

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
  createdAt: Date;
  updatedAt: Date;
}
