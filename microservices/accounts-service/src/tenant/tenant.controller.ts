import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TENANT_PATTERNS, ONBOARDING_PATTERNS, TenantMode } from '@repo/shared';
import { TenantService } from './tenant.service';

@Controller()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @MessagePattern(TENANT_PATTERNS.CREATE)
  async create(@Payload() data: any) {
    return this.tenantService.create(data);
  }

  @MessagePattern(TENANT_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    return this.tenantService.findById(data.id);
  }

  @MessagePattern(TENANT_PATTERNS.FIND_ALL)
  async findAll() {
    return this.tenantService.findAll();
  }

  @MessagePattern(TENANT_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; updates: any }) {
    return this.tenantService.update(data.id, data.updates);
  }

  @MessagePattern(ONBOARDING_PATTERNS.COMPLETE)
  async completeOnboarding(
    @Payload() data: { tenantId: string; mode: any; soloProfile?: any },
  ) {
    return this.tenantService.completeOnboarding(
      data.tenantId,
      data.mode,
      data.soloProfile,
    );
  }

  @MessagePattern(TENANT_PATTERNS.SWITCH_MODE)
  async switchMode(
    @Payload()
    data: {
      tenantId: string;
      mode: TenantMode;
      soloProfile?: any;
      workingHours?: any;
    },
  ) {
    return this.tenantService.switchMode(
      data.tenantId,
      data.mode,
      data.soloProfile,
      data.workingHours,
    );
  }
}
