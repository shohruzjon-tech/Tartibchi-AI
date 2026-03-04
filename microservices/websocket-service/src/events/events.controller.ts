import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WEBSOCKET_PATTERNS } from '@repo/shared';
import { QueueWebSocketGateway } from '../gateway/queue.gateway';

/**
 * Receives TCP messages from other microservices and emits WebSocket events
 */
@Controller()
export class EventsController {
  constructor(private readonly wsGateway: QueueWebSocketGateway) {}

  @MessagePattern(WEBSOCKET_PATTERNS.EMIT_QUEUE_UPDATE)
  handleQueueUpdate(@Payload() data: { branchId: string; payload: any }) {
    this.wsGateway.emitQueueUpdate(data.branchId, data.payload);
    return { emitted: true };
  }

  @MessagePattern(WEBSOCKET_PATTERNS.EMIT_TICKET_CALLED)
  handleTicketCalled(@Payload() data: {
    branchId: string;
    ticketId: string;
    displayNumber: string;
    counterName: string;
    counterId: string;
    queueId: string;
  }) {
    this.wsGateway.emitTicketCalled(data.branchId, data);
    return { emitted: true };
  }

  @MessagePattern(WEBSOCKET_PATTERNS.EMIT_DISPLAY_UPDATE)
  handleDisplayUpdate(@Payload() data: { branchId: string; payload: any }) {
    this.wsGateway.emitDisplayUpdate(data.branchId, data.payload);
    return { emitted: true };
  }

  @MessagePattern(WEBSOCKET_PATTERNS.EMIT_COUNTER_UPDATE)
  handleCounterUpdate(@Payload() data: { counterId: string; payload: any }) {
    this.wsGateway.emitCounterUpdate(data.counterId, data.payload);
    return { emitted: true };
  }
}
