export interface ICustomer {
  _id?: string;
  phone: string;
  firstName: string;
  lastName?: string;
  tenantId: string;
  telegramId?: string;
  telegramChatId?: string;
  email?: string;
  totalVisits: number;
  lastVisitAt?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
