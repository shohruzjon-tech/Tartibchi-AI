import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DOCUMENT_PATTERNS } from '@repo/shared';
import { AttachmentService } from './attachment.service';

@Controller()
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @MessagePattern(DOCUMENT_PATTERNS.CREATE)
  async create(@Payload() data: any) {
    return this.attachmentService.create(data);
  }

  @MessagePattern(DOCUMENT_PATTERNS.FIND_BY_USER)
  async findByUser(@Payload() data: { userId: string }) {
    return this.attachmentService.findByUser(data.userId);
  }

  @MessagePattern(DOCUMENT_PATTERNS.DELETE)
  async delete(@Payload() data: { id: string }) {
    return this.attachmentService.delete(data.id);
  }
}
