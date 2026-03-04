import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SubscriptionPlan, TenantMode } from '@repo/shared';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ enum: TenantMode })
  mode: TenantMode;

  @Prop({ default: false })
  onboardingCompleted: boolean;

  @Prop({
    required: true,
    enum: SubscriptionPlan,
    default: SubscriptionPlan.BASIC,
  })
  subscriptionPlan: SubscriptionPlan;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  telegramBotToken: string;

  @Prop({ default: 0 })
  smsBalance: number;

  @Prop({ default: 15 })
  avgServiceTime: number;

  @Prop({ type: Object })
  soloProfile: Record<string, any>;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.index({ slug: 1 }, { unique: true });
