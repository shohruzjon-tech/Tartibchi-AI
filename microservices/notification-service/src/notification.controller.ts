import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NOTIFICATION_PATTERNS } from '@repo/shared';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern(NOTIFICATION_PATTERNS.SEND_SMS)
  async sendSms(@Payload() data: { phone: string; message: string; tenantId?: string }) {
    return this.notificationService.sendSms(data.phone, data.message);
  }

  @MessagePattern(NOTIFICATION_PATTERNS.SEND_TELEGRAM)
  async sendTelegram(@Payload() data: { chatId: string; message: string; tenantId?: string }) {
    return this.notificationService.sendTelegram(data.chatId, data.message, data.tenantId);
  }

  @MessagePattern(NOTIFICATION_PATTERNS.TICKET_APPROACHING)
  async ticketApproaching(@Payload() data: {
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
    return this.notificationService.notifyTicketApproaching(data);
  }
}
