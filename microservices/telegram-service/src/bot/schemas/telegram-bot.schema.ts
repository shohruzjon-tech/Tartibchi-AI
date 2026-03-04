import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TelegramBotDocument = TelegramBot & Document;

@Schema({ timestamps: true, collection: 'telegram_bots' })
export class TelegramBot {
  @Prop({ required: true, unique: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  botToken: string;

  @Prop()
  botUsername: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const TelegramBotSchema = SchemaFactory.createForClass(TelegramBot);
