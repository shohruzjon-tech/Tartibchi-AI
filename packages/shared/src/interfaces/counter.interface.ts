export interface ICounter {
  _id?: string;
  tenantId: string;
  branchId: string;
  name: string;
  counterNumber?: number;
  description?: string;
  location?: string;
  floor?: string;
  languages?: string[];
  maxConcurrentTickets?: number;
  priority?: number;
  tags?: string[];
  queueIds: string[];
  isActive: boolean;
  currentTicketId?: string;
  staffId?: string;
  employeeId: string;
  login?: string;
  createdAt: Date;
  updatedAt: Date;
}
