import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema({ timestamps: true, collection: 'counters' })
export class Counter {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  // Unique counter number within the branch (e.g. 1, 2, 3) — used by AI for routing
  @Prop({ type: Number })
  counterNumber: number;

  // Human-readable description of what this counter handles — AI uses for intent matching
  @Prop({ trim: true })
  description: string;

  // Physical location details — AI uses for navigation guidance
  @Prop({ trim: true })
  location: string;

  @Prop({ trim: true })
  floor: string;

  // Languages spoken at this counter — AI uses for language-based routing
  @Prop({ type: [String], default: [] })
  languages: string[];

  // Max concurrent tickets this counter can handle
  @Prop({ type: Number, default: 1 })
  maxConcurrentTickets: number;

  // Priority level (higher = served first by AI agent)
  @Prop({ type: Number, default: 0 })
  priority: number;

  // Flexible tags for AI categorization and matching
  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Queue' }], default: [] })
  queueIds: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Ticket' })
  currentTicketId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  staffId: Types.ObjectId;

  // Mandatory employee assigned to this counter
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  employeeId: Types.ObjectId;

  // Login credential — employee phone number (e.g. +998901234567)
  @Prop({ trim: true })
  login: string;

  // Hashed passcode for staff authentication
  @Prop({ trim: true })
  passcode: string;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

CounterSchema.index({ tenantId: 1, branchId: 1 });
CounterSchema.index(
  { tenantId: 1, branchId: 1, counterNumber: 1 },
  { unique: true, sparse: true },
);
// One employee can only be assigned to one counter
CounterSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
