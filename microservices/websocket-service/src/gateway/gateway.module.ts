import { Module } from '@nestjs/common';
import { QueueWebSocketGateway } from './queue.gateway';

@Module({
  providers: [QueueWebSocketGateway],
  exports: [QueueWebSocketGateway],
})
export class QueueGatewayModule {}
