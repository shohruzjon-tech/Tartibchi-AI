import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AppointmentStatus } from '@repo/shared';

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', index: true })
  branchId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop()
  customerPhone: string;

  @Prop()
  customerTelegramId: string;

  @Prop({ required: true, trim: true })
  service: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({ required: true })
  timeSlot: string; // HH:mm

  @Prop({ default: 30 })
  duration: number; // minutes

  @Prop({
    required: true,
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
    index: true,
  })
  status: AppointmentStatus;

  @Prop()
  notes: string;

  @Prop()
  earnings: number;

  @Prop()
  aiSuggestion: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({ tenantId: 1, date: 1 });
AppointmentSchema.index({ tenantId: 1, date: 1, timeSlot: 1 });
AppointmentSchema.index({ tenantId: 1, status: 1 });
AppointmentSchema.index({ customerPhone: 1 });
AppointmentSchema.index({ customerTelegramId: 1 });
