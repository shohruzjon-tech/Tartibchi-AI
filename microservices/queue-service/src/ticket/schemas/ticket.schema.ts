import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketStatus } from '@repo/shared';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true, collection: 'tickets' })
export class Ticket {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Queue', required: true, index: true })
  queueId: Types.ObjectId;

  @Prop({ required: true, unique: true, uppercase: true })
  publicId: string;

  @Prop({ required: true })
  number: number;

  @Prop({ required: true })
  displayNumber: string;

  @Prop({
    required: true,
    enum: TicketStatus,
    default: TicketStatus.CREATED,
    index: true,
  })
  status: TicketStatus;

  @Prop({ type: Types.ObjectId, ref: 'Counter' })
  counterId?: Types.ObjectId;

  @Prop()
  customerPhone: string;

  @Prop()
  customerTelegramId: string;

  @Prop({ default: 10 })
  priority: number;

  @Prop()
  calledAt: Date;

  @Prop()
  servingStartedAt: Date;

  @Prop()
  completedAt: Date;

  // Populated by { timestamps: true }
  createdAt?: Date;
  updatedAt?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Composite indexes for performance
TicketSchema.index({ tenantId: 1, queueId: 1, createdAt: -1 });
TicketSchema.index({ tenantId: 1, status: 1 });
TicketSchema.index({ publicId: 1 }, { unique: true });
TicketSchema.index({ counterId: 1, status: 1 });
TicketSchema.index({ tenantId: 1, completedAt: 1 });

// Partial index for active tickets (fast dashboard queries)
TicketSchema.index(
  { tenantId: 1, branchId: 1 },
  {
    partialFilterExpression: {
      status: { $in: ['WAITING', 'CALLED', 'SERVING'] },
    },
  },
);
