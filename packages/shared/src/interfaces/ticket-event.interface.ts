import { TicketEventType } from "../enums/ticket-event-type.enum";

export interface ITicketEvent {
  _id?: string;
  ticketId: string;
  tenantId: string;
  branchId: string;
  queueId: string;
  counterId?: string;
  staffId?: string;
  type: TicketEventType;
  metadata?: Record<string, any>;
  timestamp: Date;
}
