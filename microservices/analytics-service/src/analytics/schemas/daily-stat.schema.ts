import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DailyStatDocument = DailyStat & Document;

@Schema({ timestamps: true, collection: 'daily_stats' })
export class DailyStat {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  branchId: string;

  @Prop()
  queueId: string;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ default: 0 })
  totalTickets: number;

  @Prop({ default: 0 })
  totalServed: number;

  @Prop({ default: 0 })
  totalSkipped: number;

  @Prop({ default: 0 })
  avgServiceTime: number;

  @Prop({ type: Object, default: {} })
  hourlyDistribution: Record<string, number>;
}

export const DailyStatSchema = SchemaFactory.createForClass(DailyStat);

DailyStatSchema.index({ tenantId: 1, branchId: 1, date: 1 }, { unique: true });
