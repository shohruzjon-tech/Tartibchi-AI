import { TicketStatus } from "../enums/ticket-status.enum";

export interface ITicket {
  _id?: string;
  tenantId: string;
  branchId: string;
  queueId: string;
  publicId: string;
  number: number;
  displayNumber: string;
  status: TicketStatus;
  counterId?: string;
  customerPhone?: string;
  customerTelegramId?: string;
  priority: number;
  createdAt: Date;
  calledAt?: Date;
  servingStartedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}
