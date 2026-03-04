import {
  Controller,
  Post,
  Body,
  Inject,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, AI_PATTERNS } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  @Post('suggest')
  async suggest(
    @CurrentUser() user: any,
    @Body() body: { prompt: string; context?: Record<string, any> },
  ) {
    return firstValueFrom(
      this.accountsClient.send(AI_PATTERNS.SUGGEST, {
        tenantId: user.tenantId,
        prompt: body.prompt,
        context: body.context,
      }),
    );
  }

  @Post('optimize/:date')
  async optimizeSchedule(
    @CurrentUser() user: any,
    @Param('date') date: string,
  ) {
    return firstValueFrom(
      this.accountsClient.send(AI_PATTERNS.OPTIMIZE_SCHEDULE, {
        tenantId: user.tenantId,
        date,
      }),
    );
  }

  @Post('dashboard-insights')
  async dashboardInsights(
    @CurrentUser() user: any,
    @Body() body: { analyticsData: Record<string, any> },
  ) {
    return firstValueFrom(
      this.accountsClient.send(AI_PATTERNS.DASHBOARD_INSIGHTS, {
        tenantId: user.tenantId,
        analyticsData: body.analyticsData,
      }),
    );
  }
}
