import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern({ cmd: 'queue-service.health' })
  health() {
    return {
      status: 'ok',
      service: 'queue-service',
      timestamp: new Date().toISOString(),
    };
  }
}
