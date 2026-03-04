import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QUEUE_PATTERNS } from '@repo/shared';
import { QueueService } from './queue.service';
import { RedisService } from '../redis/redis.service';

@Controller()
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
  ) {}

  @MessagePattern(QUEUE_PATTERNS.CREATE)
  async create(@Payload() data: any) {
    return this.queueService.create(data);
  }

  @MessagePattern(QUEUE_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    return this.queueService.findById(data.id);
  }

  @MessagePattern(QUEUE_PATTERNS.FIND_ALL)
  async findAll(@Payload() data: { tenantId: string; branchId?: string }) {
    return this.queueService.findAll(data);
  }

  @MessagePattern(QUEUE_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; updates: any }) {
    return this.queueService.update(data.id, data.updates);
  }

  @MessagePattern(QUEUE_PATTERNS.DELETE)
  async delete(@Payload() data: { id: string }) {
    return this.queueService.delete(data.id);
  }

  @MessagePattern(QUEUE_PATTERNS.GET_LIVE_STATUS)
  async getLiveStatus(
    @Payload() data: { tenantId: string; branchId: string; queueId: string },
  ) {
    const length = await this.redisService.getQueueLength(
      data.tenantId,
      data.branchId,
      data.queueId,
    );
    const queue = await this.queueService.findById(data.queueId);
    return {
      queueId: data.queueId,
      queueName: queue?.name,
      length,
      isActive: queue?.isActive,
    };
  }
}
