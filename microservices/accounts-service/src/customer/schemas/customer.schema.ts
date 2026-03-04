import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true, collection: 'customers' })
export class Customer {
  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ trim: true })
  lastName: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop()
  telegramId: string;

  @Prop()
  telegramChatId: string;

  @Prop()
  email: string;

  @Prop({ default: 0 })
  totalVisits: number;

  @Prop()
  lastVisitAt: Date;

  @Prop()
  notes: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// A customer is unique per phone + tenant combination
CustomerSchema.index({ phone: 1, tenantId: 1 }, { unique: true });
CustomerSchema.index({ tenantId: 1, createdAt: -1 });
CustomerSchema.index({ telegramId: 1, tenantId: 1 });
