import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BRANCH_PATTERNS } from '@repo/shared';
import { BranchService } from './branch.service';

@Controller()
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @MessagePattern(BRANCH_PATTERNS.CREATE)
  async create(@Payload() data: any) {
    return this.branchService.create(data);
  }

  @MessagePattern(BRANCH_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    return this.branchService.findById(data.id);
  }

  @MessagePattern(BRANCH_PATTERNS.FIND_BY_SLUG)
  async findBySlug(@Payload() data: { slug: string }) {
    return this.branchService.findBySlug(data.slug);
  }

  @MessagePattern(BRANCH_PATTERNS.FIND_ALL)
  async findAll(@Payload() data: { tenantId: string }) {
    return this.branchService.findByTenant(data.tenantId);
  }

  @MessagePattern(BRANCH_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; updates: any }) {
    return this.branchService.update(data.id, data.updates);
  }

  @MessagePattern(BRANCH_PATTERNS.DELETE)
  async delete(@Payload() data: { id: string }) {
    return this.branchService.delete(data.id);
  }
}
