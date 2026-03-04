import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketEventType } from '@repo/shared';

export type TicketEventDocument = TicketEvent & Document;

@Schema({ collection: 'ticket_events' })
export class TicketEvent {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  ticketId: Types.ObjectId;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  branchId: string;

  @Prop({ required: true })
  queueId: string;

  @Prop()
  counterId: string;

  @Prop()
  staffId: string;

  @Prop({ required: true, enum: TicketEventType })
  type: TicketEventType;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ required: true, default: () => new Date(), index: true })
  timestamp: Date;
}

export const TicketEventSchema = SchemaFactory.createForClass(TicketEvent);

TicketEventSchema.index({ tenantId: 1, branchId: 1, timestamp: -1 });
TicketEventSchema.index({ tenantId: 1, queueId: 1, type: 1 });
TicketEventSchema.index({ tenantId: 1, counterId: 1, type: 1 });
