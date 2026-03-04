import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { USER_PATTERNS } from '@repo/shared';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(USER_PATTERNS.CREATE)
  async create(@Payload() data: any) {
    return this.userService.create(data);
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    return this.userService.findById(data.id);
  }

  @MessagePattern(USER_PATTERNS.FIND_BY_EMAIL)
  async findByEmail(@Payload() data: { email: string }) {
    return this.userService.findByEmail(data.email);
  }

  @MessagePattern(USER_PATTERNS.FIND_BY_PHONE)
  async findByPhone(@Payload() data: { phone: string }) {
    return this.userService.findByPhone(data.phone);
  }

  @MessagePattern(USER_PATTERNS.FIND_ALL)
  async findAll(@Payload() data: { tenantId?: string; branchId?: string }) {
    return this.userService.findAll(data);
  }

  @MessagePattern(USER_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; updates: any }) {
    return this.userService.update(data.id, data.updates);
  }
}
