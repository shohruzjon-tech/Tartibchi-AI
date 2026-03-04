import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, TELEGRAM_PATTERNS, UserRole } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('telegram')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TelegramController {
  constructor(
    @Inject(SERVICES.TELEGRAM) private readonly telegramClient: ClientProxy,
  ) {}

  @Post('bot')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async registerBot(
    @Body() body: { botToken: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return firstValueFrom(
      this.telegramClient.send(TELEGRAM_PATTERNS.REGISTER_BOT, {
        tenantId,
        botToken: body.botToken,
      }),
    );
  }

  @Delete('bot')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async unregisterBot(@CurrentUser('tenantId') tenantId: string) {
    return firstValueFrom(
      this.telegramClient.send(TELEGRAM_PATTERNS.UNREGISTER_BOT, { tenantId }),
    );
  }

  @Get('bot/status')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async getBotStatus(@CurrentUser('tenantId') tenantId: string) {
    return firstValueFrom(
      this.telegramClient.send(TELEGRAM_PATTERNS.GET_BOT_STATUS, { tenantId }),
    );
  }

  @Post('bot/start')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async startBot(@CurrentUser('tenantId') tenantId: string) {
    return firstValueFrom(
      this.telegramClient.send(TELEGRAM_PATTERNS.START_BOT, { tenantId }),
    );
  }

  @Post('bot/stop')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async stopBot(@CurrentUser('tenantId') tenantId: string) {
    return firstValueFrom(
      this.telegramClient.send(TELEGRAM_PATTERNS.STOP_BOT, { tenantId }),
    );
  }

  @Post('bot/restart')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async restartBot(@CurrentUser('tenantId') tenantId: string) {
    return firstValueFrom(
      this.telegramClient.send(TELEGRAM_PATTERNS.RESTART_BOT, { tenantId }),
    );
  }

  @Delete('bot/delete')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async deleteBot(@CurrentUser('tenantId') tenantId: string) {
    return firstValueFrom(
      this.telegramClient.send(TELEGRAM_PATTERNS.DELETE_BOT, { tenantId }),
    );
  }

  @Get('bot/stats')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async getBotStats(@CurrentUser('tenantId') tenantId: string) {
    return firstValueFrom(
      this.telegramClient.send(TELEGRAM_PATTERNS.GET_BOT_STATS, { tenantId }),
    );
  }
}
