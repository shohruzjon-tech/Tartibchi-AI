import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, QUEUE_PATTERNS, UserRole } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';

@Controller('queues')
export class QueueController {
  constructor(
    @Inject(SERVICES.QUEUE) private readonly queueClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async create(@Body() body: any, @CurrentUser('tenantId') tenantId: string) {
    const resolvedTenantId = tenantId || body.tenantId;
    if (!resolvedTenantId) {
      throw new BadRequestException(
        'tenantId is required. Please ensure your account is linked to a tenant.',
      );
    }
    return firstValueFrom(
      this.queueClient.send(QUEUE_PATTERNS.CREATE, {
        ...body,
        tenantId: resolvedTenantId,
      }),
    );
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.queueClient.send(QUEUE_PATTERNS.FIND_ONE, { id }),
    );
  }

  @Get()
  @Public()
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('branchId') branchId: string,
  ) {
    return firstValueFrom(
      this.queueClient.send(QUEUE_PATTERNS.FIND_ALL, { tenantId, branchId }),
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(
      this.queueClient.send(QUEUE_PATTERNS.UPDATE, { id, updates: body }),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async delete(@Param('id') id: string) {
    return firstValueFrom(this.queueClient.send(QUEUE_PATTERNS.DELETE, { id }));
  }

  @Get(':id/live')
  @Public()
  async getLiveStatus(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Query('branchId') branchId: string,
  ) {
    return firstValueFrom(
      this.queueClient.send(QUEUE_PATTERNS.GET_LIVE_STATUS, {
        tenantId,
        branchId,
        queueId: id,
      }),
    );
  }
}
