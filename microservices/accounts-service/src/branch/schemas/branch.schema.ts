import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BranchDocument = Branch & Document;

@Schema({ timestamps: true, collection: 'branches' })
export class Branch {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/,
  })
  slug: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ default: 'Asia/Tashkent' })
  timezone: string;

  @Prop({ trim: true })
  workingHours: string;

  /** Structured weekly schedule — per-day start/end/closed */
  @Prop({ type: Object })
  schedule: Record<string, { start: string; end: string; closed?: boolean }>;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  managerId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  managerIds: Types.ObjectId[];

  @Prop({ trim: true })
  managerName: string;

  @Prop({ default: 0 })
  maxDailyTickets: number;

  @Prop({ default: 15 })
  avgTimePerClient: number;

  // AI-ready fields: description for context understanding
  @Prop({ trim: true })
  description: string;

  // Service categories offered — AI uses for routing and recommendations
  @Prop({ type: [String], default: [] })
  serviceCategories: string[];

  // Flexible tags for AI matching and categorization
  @Prop({ type: [String], default: [] })
  tags: string[];

  // Languages supported at this branch — AI uses for language-based routing
  @Prop({ type: [String], default: [] })
  languages: string[];

  // Geolocation for proximity-based routing
  @Prop({ type: { lat: Number, lng: Number } })
  coordinates: { lat: number; lng: number };

  @Prop({ default: true })
  isActive: boolean;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

BranchSchema.index({ tenantId: 1, name: 1 }, { unique: true });
BranchSchema.index({ slug: 1 }, { unique: true });
