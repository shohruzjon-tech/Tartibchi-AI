import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { SubscriptionPlan } from "../enums/subscription-plan.enum";
import { TenantMode } from "../enums/tenant-mode.enum";

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscriptionPlan?: SubscriptionPlan;
}

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscriptionPlan?: SubscriptionPlan;

  @IsString()
  @IsOptional()
  telegramBotToken?: string;

  @IsEnum(TenantMode)
  @IsOptional()
  mode?: TenantMode;

  @IsBoolean()
  @IsOptional()
  onboardingCompleted?: boolean;

  @IsNumber()
  @IsOptional()
  avgServiceTime?: number;

  @IsObject()
  @IsOptional()
  soloProfile?: Record<string, any>;
}

export class CompleteOnboardingDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsEnum(TenantMode)
  @IsNotEmpty()
  mode: TenantMode;

  @IsObject()
  @IsOptional()
  soloProfile?: Record<string, any>;
}
