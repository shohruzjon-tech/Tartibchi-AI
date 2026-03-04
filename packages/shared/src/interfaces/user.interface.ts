import { UserRole } from "../enums/user-role.enum";

export interface IUser {
  _id?: string;
  email?: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegramId?: string;
  role: UserRole;
  tenantId?: string;
  branchId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
