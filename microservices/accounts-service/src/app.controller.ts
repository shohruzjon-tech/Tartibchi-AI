import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern({ cmd: 'accounts.health' })
  health() {
    return {
      status: 'ok',
      service: 'accounts-service',
      timestamp: new Date().toISOString(),
    };
  }
}
