import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Inject,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, COUNTER_PATTERNS, UserRole } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('counters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CounterController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
    @Inject(SERVICES.QUEUE) private readonly queueClient: ClientProxy,
  ) {}

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async create(@Body() body: any, @CurrentUser('tenantId') tenantId: string) {
    const resolvedTenantId = body.tenantId || tenantId;
    if (!resolvedTenantId) {
      throw new BadRequestException(
        'tenantId is required. Please complete your account setup first.',
      );
    }
    if (!body.employeeId) {
      throw new BadRequestException(
        'employeeId is required. Please assign an employee to the counter.',
      );
    }
    return firstValueFrom(
      this.accountsClient.send(COUNTER_PATTERNS.CREATE, {
        ...body,
        tenantId: resolvedTenantId,
      }),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.accountsClient.send(COUNTER_PATTERNS.FIND_ONE, { id }),
    );
  }

  @Get()
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('branchId') branchId: string,
    @CurrentUser('tenantId') userTenantId: string,
  ) {
    return firstValueFrom(
      this.accountsClient.send(COUNTER_PATTERNS.FIND_ALL, {
        tenantId: tenantId || userTenantId,
        branchId,
      }),
    );
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(COUNTER_PATTERNS.UPDATE, { id, updates: body }),
    );
  }

  // ======== STAFF ACTIONS ========

  @Post(':id/next')
  @Roles(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.TENANT_ADMIN)
  async next(@Param('id') counterId: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.queueClient.send(COUNTER_PATTERNS.NEXT, {
        counterId,
        tenantId: user.tenantId,
        branchId: user.branchId,
        staffId: user.userId,
      }),
    );
  }

  @Post(':id/recall')
  @Roles(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.TENANT_ADMIN)
  async recall(@Param('id') counterId: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.queueClient.send(COUNTER_PATTERNS.RECALL, {
        counterId,
        tenantId: user.tenantId,
        branchId: user.branchId,
      }),
    );
  }

  @Post(':id/skip')
  @Roles(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.TENANT_ADMIN)
  async skip(@Param('id') counterId: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.queueClient.send(COUNTER_PATTERNS.SKIP, {
        counterId,
        tenantId: user.tenantId,
        branchId: user.branchId,
      }),
    );
  }

  @Post(':id/start')
  @Roles(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.TENANT_ADMIN)
  async startServing(@Param('id') counterId: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.queueClient.send(COUNTER_PATTERNS.START_SERVING, {
        counterId,
        tenantId: user.tenantId,
        branchId: user.branchId,
      }),
    );
  }

  @Post(':id/done')
  @Roles(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.TENANT_ADMIN)
  async done(@Param('id') counterId: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.queueClient.send(COUNTER_PATTERNS.DONE, {
        counterId,
        tenantId: user.tenantId,
        branchId: user.branchId,
      }),
    );
  }

  @Post(':id/transfer')
  @Roles(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.TENANT_ADMIN)
  async transfer(
    @Param('id') counterId: string,
    @Body() body: { targetQueueId: string },
    @CurrentUser() user: any,
  ) {
    return firstValueFrom(
      this.queueClient.send(COUNTER_PATTERNS.TRANSFER, {
        counterId,
        tenantId: user.tenantId,
        branchId: user.branchId,
        targetQueueId: body.targetQueueId,
      }),
    );
  }
}
