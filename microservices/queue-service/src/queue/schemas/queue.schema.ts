import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QueueStrategy } from '@repo/shared';

export type QueueDocument = Queue & Document;

@Schema({ timestamps: true, collection: 'queues' })
export class Queue {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, uppercase: true })
  prefix: string;

  @Prop({ required: true, enum: QueueStrategy, default: QueueStrategy.FIFO })
  strategy: QueueStrategy;

  @Prop({ default: true })
  isActive: boolean;
}

export const QueueSchema = SchemaFactory.createForClass(Queue);

QueueSchema.index({ tenantId: 1, branchId: 1 });
QueueSchema.index({ tenantId: 1, branchId: 1, prefix: 1 }, { unique: true });
