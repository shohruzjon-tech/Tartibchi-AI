import { QueueStrategy } from "../enums/queue-strategy.enum";

export interface IQueue {
  _id?: string;
  tenantId: string;
  branchId: string;
  name: string;
  prefix: string;
  strategy: QueueStrategy;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
