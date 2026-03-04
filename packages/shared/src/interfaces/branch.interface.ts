export interface IBranch {
  _id?: string;
  tenantId: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  timezone: string;
  workingHours?: string;
  managerId?: string;
  managerName?: string;
  maxDailyTickets?: number;
  description?: string;
  serviceCategories?: string[];
  tags?: string[];
  languages?: string[];
  coordinates?: { lat: number; lng: number };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
