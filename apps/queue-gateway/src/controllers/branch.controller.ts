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
import { SERVICES, BRANCH_PATTERNS, UserRole } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('branches')
export class BranchController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  /** Public endpoint — no auth required. Used by the ticketing page. */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return firstValueFrom(
      this.accountsClient.send(BRANCH_PATTERNS.FIND_BY_SLUG, { slug }),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() body: any, @CurrentUser('tenantId') tenantId: string) {
    const resolvedTenantId = tenantId || body.tenantId;
    if (!resolvedTenantId) {
      throw new BadRequestException(
        'tenantId is required. Please ensure your account is linked to a tenant.',
      );
    }
    return firstValueFrom(
      this.accountsClient.send(BRANCH_PATTERNS.CREATE, {
        ...body,
        tenantId: resolvedTenantId,
      }),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.accountsClient.send(BRANCH_PATTERNS.FIND_ONE, { id }),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query('tenantId') tenantId: string,
    @CurrentUser('tenantId') userTenantId: string,
  ) {
    return firstValueFrom(
      this.accountsClient.send(BRANCH_PATTERNS.FIND_ALL, {
        tenantId: tenantId || userTenantId,
      }),
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  async update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(BRANCH_PATTERNS.UPDATE, { id, updates: body }),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async delete(@Param('id') id: string) {
    return firstValueFrom(
      this.accountsClient.send(BRANCH_PATTERNS.DELETE, { id }),
    );
  }
}
