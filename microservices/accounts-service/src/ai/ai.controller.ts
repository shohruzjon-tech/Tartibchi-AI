import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AI_PATTERNS } from '@repo/shared';
import { AiService } from './ai.service';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @MessagePattern(AI_PATTERNS.SUGGEST)
  async suggest(data: {
    tenantId: string;
    prompt: string;
    context?: Record<string, any>;
  }) {
    return this.aiService.suggest(data.tenantId, data.prompt, data.context);
  }

  @MessagePattern(AI_PATTERNS.OPTIMIZE_SCHEDULE)
  async optimizeSchedule(data: { tenantId: string; date: string }) {
    return this.aiService.optimizeSchedule(data.tenantId, data.date);
  }

  @MessagePattern(AI_PATTERNS.DASHBOARD_INSIGHTS)
  async dashboardInsights(data: {
    tenantId: string;
    analyticsData: Record<string, any>;
  }) {
    return this.aiService.dashboardInsights(data.tenantId, data.analyticsData);
  }
}
