import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TelegramUserDocument = TelegramUser & Document;

@Schema({ timestamps: true, collection: 'telegram_users' })
export class TelegramUser {
  @Prop({ required: true, unique: true, index: true })
  telegramId: number;

  @Prop({ required: true })
  chatId: number;

  @Prop()
  tenantId: string;

  @Prop()
  phone: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ default: 'uz' })
  language: string;
}

export const TelegramUserSchema = SchemaFactory.createForClass(TelegramUser);

TelegramUserSchema.index({ phone: 1 });
TelegramUserSchema.index({ tenantId: 1 });
