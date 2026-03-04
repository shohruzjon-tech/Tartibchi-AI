import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TICKET_PATTERNS, COUNTER_PATTERNS } from '@repo/shared';
import { TicketService } from './ticket.service';

@Controller()
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @MessagePattern(TICKET_PATTERNS.CREATE)
  async create(@Payload() data: any) {
    return this.ticketService.createTicket(data);
  }

  @MessagePattern(TICKET_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    return this.ticketService.findById(data.id);
  }

  @MessagePattern(TICKET_PATTERNS.GET_STATUS)
  async getStatus(@Payload() data: { publicId: string }) {
    return this.ticketService.getTicketStatus(data.publicId);
  }

  @MessagePattern(TICKET_PATTERNS.GET_QUEUE_TICKETS)
  async getQueueTickets(
    @Payload() data: { tenantId: string; branchId: string; queueId: string },
  ) {
    return this.ticketService.getQueueTickets(data);
  }

  @MessagePattern(TICKET_PATTERNS.GET_ESTIMATED_WAIT)
  async getEstimatedWait(@Payload() data: { publicId: string }) {
    return this.ticketService.getEstimatedWait(data.publicId);
  }

  // ======== STAFF COUNTER ACTIONS ========

  @MessagePattern(COUNTER_PATTERNS.NEXT)
  async counterNext(
    @Payload()
    data: {
      counterId: string;
      tenantId: string;
      branchId: string;
      staffId?: string;
    },
  ) {
    return this.ticketService.callNext(data);
  }

  @MessagePattern(COUNTER_PATTERNS.RECALL)
  async counterRecall(
    @Payload() data: { counterId: string; tenantId: string; branchId: string },
  ) {
    return this.ticketService.recallTicket(data);
  }

  @MessagePattern(COUNTER_PATTERNS.SKIP)
  async counterSkip(
    @Payload() data: { counterId: string; tenantId: string; branchId: string },
  ) {
    return this.ticketService.skipTicket(data);
  }

  @MessagePattern(COUNTER_PATTERNS.START_SERVING)
  async counterStartServing(
    @Payload() data: { counterId: string; tenantId: string; branchId: string },
  ) {
    return this.ticketService.startServing(data);
  }

  @MessagePattern(COUNTER_PATTERNS.DONE)
  async counterDone(
    @Payload() data: { counterId: string; tenantId: string; branchId: string },
  ) {
    return this.ticketService.completeTicket(data);
  }

  @MessagePattern(COUNTER_PATTERNS.TRANSFER)
  async counterTransfer(
    @Payload()
    data: {
      counterId: string;
      tenantId: string;
      branchId: string;
      targetQueueId: string;
    },
  ) {
    return this.ticketService.transferTicket(data);
  }
}
