import { Controller, Get, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, ANALYTICS_PATTERNS, UserRole } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
export class AnalyticsController {
  constructor(
    @Inject(SERVICES.ANALYTICS) private readonly analyticsClient: ClientProxy,
  ) {}

  @Get('daily')
  async dailyStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return firstValueFrom(
      this.analyticsClient.send(ANALYTICS_PATTERNS.DAILY_STATS, {
        tenantId,
        branchId,
        startDate,
        endDate,
      }),
    );
  }

  @Get('queues')
  async queueStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string,
    @Query('queueId') queueId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return firstValueFrom(
      this.analyticsClient.send(ANALYTICS_PATTERNS.QUEUE_STATS, {
        tenantId,
        branchId,
        queueId,
        startDate,
        endDate,
      }),
    );
  }

  @Get('counters')
  async counterStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string,
    @Query('counterId') counterId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return firstValueFrom(
      this.analyticsClient.send(ANALYTICS_PATTERNS.COUNTER_STATS, {
        tenantId,
        branchId,
        counterId,
        startDate,
        endDate,
      }),
    );
  }

  @Get('branch')
  async branchStats(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return firstValueFrom(
      this.analyticsClient.send(ANALYTICS_PATTERNS.BRANCH_STATS, {
        tenantId,
        branchId,
        startDate,
        endDate,
      }),
    );
  }

  @Get('peak-hours')
  async peakHours(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return firstValueFrom(
      this.analyticsClient.send(ANALYTICS_PATTERNS.PEAK_HOURS, {
        tenantId,
        branchId,
        startDate,
        endDate,
      }),
    );
  }

  @Get('dashboard-summary')
  async dashboardSummary(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return firstValueFrom(
      this.analyticsClient.send(ANALYTICS_PATTERNS.DASHBOARD_SUMMARY, {
        tenantId,
        branchId,
        startDate,
        endDate,
      }),
    );
  }

  @Get('employee-performance')
  async employeePerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return firstValueFrom(
      this.analyticsClient.send(ANALYTICS_PATTERNS.EMPLOYEE_PERFORMANCE, {
        tenantId,
        branchId,
        startDate,
        endDate,
      }),
    );
  }
}
