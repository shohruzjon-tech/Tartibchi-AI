import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TELEGRAM_PATTERNS } from '@repo/shared';
import { BotManagerService } from './bot-manager.service';

@Controller()
export class BotController {
  constructor(private readonly botManager: BotManagerService) {}

  @MessagePattern(TELEGRAM_PATTERNS.REGISTER_BOT)
  async registerBot(@Payload() data: { tenantId: string; botToken: string }) {
    return this.botManager.registerBot(data.tenantId, data.botToken);
  }

  @MessagePattern(TELEGRAM_PATTERNS.UNREGISTER_BOT)
  async unregisterBot(@Payload() data: { tenantId: string }) {
    return this.botManager.unregisterBot(data.tenantId);
  }

  @MessagePattern(TELEGRAM_PATTERNS.SEND_MESSAGE)
  async sendMessage(
    @Payload() data: { chatId: string; message: string; tenantId: string },
  ) {
    return this.botManager.sendMessage(
      data.tenantId,
      data.chatId,
      data.message,
    );
  }

  @MessagePattern(TELEGRAM_PATTERNS.LINK_USER)
  async linkUser(
    @Payload() data: { telegramId: string; phone: string; tenantId?: string },
  ) {
    return this.botManager.linkUser(data);
  }

  @MessagePattern(TELEGRAM_PATTERNS.GET_BOT_STATUS)
  async getBotStatus(@Payload() data: { tenantId: string }) {
    return this.botManager.getBotStatus(data.tenantId);
  }

  @MessagePattern(TELEGRAM_PATTERNS.START_BOT)
  async startBot(@Payload() data: { tenantId: string }) {
    return this.botManager.startBot_(data.tenantId);
  }

  @MessagePattern(TELEGRAM_PATTERNS.STOP_BOT)
  async stopBot(@Payload() data: { tenantId: string }) {
    return this.botManager.stopBot_(data.tenantId);
  }

  @MessagePattern(TELEGRAM_PATTERNS.RESTART_BOT)
  async restartBot(@Payload() data: { tenantId: string }) {
    return this.botManager.restartBot(data.tenantId);
  }

  @MessagePattern(TELEGRAM_PATTERNS.DELETE_BOT)
  async deleteBot(@Payload() data: { tenantId: string }) {
    return this.botManager.deleteBot(data.tenantId);
  }

  @MessagePattern(TELEGRAM_PATTERNS.GET_BOT_STATS)
  async getBotStats(@Payload() data: { tenantId: string }) {
    return this.botManager.getBotStats(data.tenantId);
  }
}
