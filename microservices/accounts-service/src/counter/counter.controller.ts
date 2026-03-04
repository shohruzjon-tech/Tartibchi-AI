import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { COUNTER_PATTERNS } from '@repo/shared';
import { CounterService } from './counter.service';

@Controller()
export class CounterController {
  constructor(private readonly counterService: CounterService) {}

  @MessagePattern(COUNTER_PATTERNS.CREATE)
  async create(@Payload() data: any) {
    return this.counterService.create(data);
  }

  @MessagePattern(COUNTER_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    return this.counterService.findById(data.id);
  }

  @MessagePattern(COUNTER_PATTERNS.FIND_ALL)
  async findAll(@Payload() data: { tenantId: string; branchId?: string }) {
    return this.counterService.findAll(data);
  }

  @MessagePattern(COUNTER_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; updates: any }) {
    return this.counterService.update(data.id, data.updates);
  }
}
