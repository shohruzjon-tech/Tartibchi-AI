import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CUSTOMER_PATTERNS } from '@repo/shared';
import { CustomerService } from './customer.service';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @MessagePattern(CUSTOMER_PATTERNS.CREATE)
  async create(@Payload() data: any) {
    return this.customerService.create(data);
  }

  @MessagePattern(CUSTOMER_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    return this.customerService.findById(data.id);
  }

  @MessagePattern(CUSTOMER_PATTERNS.FIND_BY_PHONE)
  async findByPhone(@Payload() data: { tenantId: string; phone: string }) {
    return this.customerService.findByPhone(data.tenantId, data.phone);
  }

  @MessagePattern(CUSTOMER_PATTERNS.FIND_ALL)
  async findAll(@Payload() data: { tenantId: string; search?: string }) {
    return this.customerService.findAll(data);
  }

  @MessagePattern(CUSTOMER_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; updates: any }) {
    return this.customerService.update(data.id, data.updates);
  }

  @MessagePattern(CUSTOMER_PATTERNS.DELETE)
  async delete(@Payload() data: { id: string }) {
    return this.customerService.delete(data.id);
  }

  @MessagePattern(CUSTOMER_PATTERNS.FIND_OR_CREATE)
  async findOrCreate(
    @Payload()
    data: {
      tenantId: string;
      phone: string;
      firstName?: string;
      lastName?: string;
      telegramId?: string;
      telegramChatId?: string;
    },
  ) {
    return this.customerService.findOrCreate(data);
  }

  @MessagePattern(CUSTOMER_PATTERNS.FIND_BY_TELEGRAM)
  async findByTelegram(
    @Payload() data: { tenantId: string; telegramId: string },
  ) {
    return this.customerService.findByTelegramId(
      data.tenantId,
      data.telegramId,
    );
  }
}
