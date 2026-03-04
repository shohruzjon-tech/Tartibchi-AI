export interface ITelegramBot {
  _id?: string;
  tenantId: string;
  botToken: string;
  botUsername: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITelegramUser {
  _id?: string;
  telegramId: number;
  chatId: number;
  tenantId?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}
