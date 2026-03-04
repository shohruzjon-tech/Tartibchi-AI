import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ANALYTICS_PATTERNS } from '@repo/shared';
import { AnalyticsService } from './analytics.service';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @MessagePattern(ANALYTICS_PATTERNS.RECORD_EVENT)
  async recordEvent(@Payload() data: any) {
    return this.analyticsService.recordEvent(data);
  }

  @MessagePattern(ANALYTICS_PATTERNS.DAILY_STATS)
  async dailyStats(
    @Payload()
    data: {
      tenantId: string;
      branchId?: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.analyticsService.getDailyStats(data);
  }

  @MessagePattern(ANALYTICS_PATTERNS.QUEUE_STATS)
  async queueStats(
    @Payload()
    data: {
      tenantId: string;
      branchId?: string;
      queueId?: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.analyticsService.getQueueStats(data);
  }

  @MessagePattern(ANALYTICS_PATTERNS.COUNTER_STATS)
  async counterStats(
    @Payload()
    data: {
      tenantId: string;
      branchId?: string;
      counterId?: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.analyticsService.getCounterStats(data);
  }

  @MessagePattern(ANALYTICS_PATTERNS.BRANCH_STATS)
  async branchStats(
    @Payload()
    data: {
      tenantId: string;
      branchId: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.analyticsService.getBranchStats(data);
  }

  @MessagePattern(ANALYTICS_PATTERNS.PEAK_HOURS)
  async peakHours(
    @Payload()
    data: {
      tenantId: string;
      branchId: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.analyticsService.getPeakHours(data);
  }

  @MessagePattern(ANALYTICS_PATTERNS.DASHBOARD_SUMMARY)
  async dashboardSummary(
    @Payload()
    data: {
      tenantId: string;
      branchId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.analyticsService.getDashboardSummary(data);
  }

  @MessagePattern(ANALYTICS_PATTERNS.EMPLOYEE_PERFORMANCE)
  async employeePerformance(
    @Payload()
    data: {
      tenantId: string;
      branchId?: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.analyticsService.getEmployeePerformance(data);
  }
}
