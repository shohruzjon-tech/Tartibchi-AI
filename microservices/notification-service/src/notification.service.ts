import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms/sms.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  // Notification messages in 3 languages
  private readonly messages = {
    ticketApproaching: {
      uz: (displayNumber: string, position: number, minutes: number) =>
        `Navbatingiz yaqinlashmoqda! Chiptangiz: ${displayNumber}. Sizdan oldin: ${position} kishi. Taxminiy kutish: ${minutes} daqiqa.`,
      ru: (displayNumber: string, position: number, minutes: number) =>
        `Ваша очередь приближается! Ваш талон: ${displayNumber}. Перед вами: ${position} чел. Ожидание: ~${minutes} мин.`,
      en: (displayNumber: string, position: number, minutes: number) =>
        `Your turn is approaching! Ticket: ${displayNumber}. Ahead of you: ${position}. Est. wait: ${minutes} min.`,
    },
    ticketCalled: {
      uz: (displayNumber: string, counterName: string) =>
        `Navbatingiz keldi! Chiptangiz: ${displayNumber}. ${counterName} ga boring.`,
      ru: (displayNumber: string, counterName: string) =>
        `Ваша очередь! Талон: ${displayNumber}. Подойдите к ${counterName}.`,
      en: (displayNumber: string, counterName: string) =>
        `Your turn! Ticket: ${displayNumber}. Please go to ${counterName}.`,
    },
  };

  constructor(private readonly smsService: SmsService) {}

  async sendSms(phone: string, message: string) {
    try {
      const result = await this.smsService.send(phone, message);
      this.logger.log(`SMS sent to ${phone}`);
      return { success: true, result };
    } catch (error) {
      this.logger.error(`SMS failed to ${phone}`, error);
      return { success: false, error: error.message };
    }
  }

  async sendTelegram(chatId: string, message: string, tenantId?: string) {
    // This will be called via the telegram-service
    // The notification service acts as an orchestrator
    this.logger.log(`Telegram notification queued for chat ${chatId}`);
    return { success: true, chatId, message };
  }

  async notifyTicketApproaching(data: {
    ticketId: string;
    tenantId: string;
    branchId: string;
    position: number;
    estimatedWaitMinutes: number;
    customerPhone?: string;
    customerTelegramId?: string;
    displayNumber: string;
    language?: string;
  }) {
    const lang = (data.language || 'uz') as 'uz' | 'ru' | 'en';
    const message = this.messages.ticketApproaching[lang](
      data.displayNumber,
      data.position,
      data.estimatedWaitMinutes,
    );

    const results: any[] = [];

    // Send SMS if phone provided
    if (data.customerPhone) {
      const smsResult = await this.sendSms(data.customerPhone, message);
      results.push({ type: 'sms', ...smsResult });
    }

    // Queue Telegram if Telegram ID provided
    if (data.customerTelegramId) {
      const tgResult = await this.sendTelegram(data.customerTelegramId, message, data.tenantId);
      results.push({ type: 'telegram', ...tgResult });
    }

    return { ticketId: data.ticketId, notifications: results };
  }
}
