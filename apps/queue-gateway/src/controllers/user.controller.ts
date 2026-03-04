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
import { SERVICES, USER_PATTERNS, AUTH_PATTERNS, UserRole } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  /**
   * Create a new employee (staff/branch-manager).
   * Uses auth.register pattern so password is hashed by the auth service.
   */
  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async create(@Body() body: any, @CurrentUser('tenantId') tenantId: string) {
    const resolvedTenantId = tenantId || body.tenantId;
    if (!resolvedTenantId) {
      throw new BadRequestException(
        'tenantId is required. Please ensure your account is linked to a tenant.',
      );
    }

    // Use auth.register so password is hashed by the auth service
    const result = await firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.REGISTER, {
        ...body,
        tenantId: resolvedTenantId,
        role: body.role || UserRole.STAFF,
      }),
    );

    // Return the user data without tokens (admin-created employee)
    return result.user || result;
  }

  @Get(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.accountsClient.send(USER_PATTERNS.FIND_ONE, { id }),
    );
  }

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('branchId') branchId: string,
    @CurrentUser('tenantId') userTenantId: string,
  ) {
    return firstValueFrom(
      this.accountsClient.send(USER_PATTERNS.FIND_ALL, {
        tenantId: tenantId || userTenantId,
        ...(branchId ? { branchId } : {}),
      }),
    );
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async update(@Param('id') id: string, @Body() body: any) {
    // Don't allow password updates through this endpoint
    const { password, ...updates } = body;
    return firstValueFrom(
      this.accountsClient.send(USER_PATTERNS.UPDATE, { id, updates }),
    );
  }
}
