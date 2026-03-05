import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  SERVICES,
  TENANT_PATTERNS,
  ONBOARDING_PATTERNS,
  UserRole,
} from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  async create(@Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(TENANT_PATTERNS.CREATE, body),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.accountsClient.send(TENANT_PATTERNS.FIND_ONE, { id }),
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  async findAll() {
    return firstValueFrom(
      this.accountsClient.send(TENANT_PATTERNS.FIND_ALL, {}),
    );
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(TENANT_PATTERNS.UPDATE, { id, updates: body }),
    );
  }

  @Post('onboarding')
  @Roles(UserRole.TENANT_ADMIN)
  async completeOnboarding(
    @CurrentUser() user: any,
    @Body() body: { mode: string; soloProfile?: any },
  ) {
    return firstValueFrom(
      this.accountsClient.send(ONBOARDING_PATTERNS.COMPLETE, {
        tenantId: user.tenantId,
        mode: body.mode,
        soloProfile: body.soloProfile,
      }),
    );
  }

  @Post('switch-mode')
  @Roles(UserRole.TENANT_ADMIN)
  async switchMode(
    @CurrentUser() user: any,
    @Body() body: { mode: string; soloProfile?: any; workingHours?: any },
  ) {
    return firstValueFrom(
      this.accountsClient.send(TENANT_PATTERNS.SWITCH_MODE, {
        tenantId: user.tenantId,
        mode: body.mode,
        soloProfile: body.soloProfile,
        workingHours: body.workingHours,
      }),
    );
  }
}
