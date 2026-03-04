import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
  ) {}

  /**
   * Create a new customer for a tenant
   */
  async create(data: Partial<Customer>): Promise<CustomerDocument> {
    const customer = new this.customerModel(data);
    return customer.save();
  }

  /**
   * Find customer by phone within a tenant workspace
   */
  async findByPhone(
    tenantId: string,
    phone: string,
  ): Promise<CustomerDocument | null> {
    return this.customerModel.findOne({ tenantId, phone }).exec();
  }

  /**
   * Find or create: check if customer exists by phone in tenant,
   * if not, create with provided name.
   * Returns { customer, isNew }
   */
  async findOrCreate(data: {
    tenantId: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    telegramId?: string;
    telegramChatId?: string;
  }): Promise<{ customer: CustomerDocument; isNew: boolean }> {
    let customer = await this.customerModel
      .findOne({ tenantId: data.tenantId, phone: data.phone })
      .exec();

    if (customer) {
      // Bump visit count
      customer.totalVisits += 1;
      customer.lastVisitAt = new Date();
      // Update telegram info if provided and missing
      if (data.telegramId && !customer.telegramId) {
        customer.telegramId = data.telegramId;
      }
      if (data.telegramChatId && !customer.telegramChatId) {
        customer.telegramChatId = data.telegramChatId;
      }
      await customer.save();
      return { customer, isNew: false };
    }

    customer = new this.customerModel({
      tenantId: data.tenantId,
      phone: data.phone,
      firstName: data.firstName || 'Customer',
      lastName: data.lastName || '',
      telegramId: data.telegramId,
      telegramChatId: data.telegramChatId,
      totalVisits: 1,
      lastVisitAt: new Date(),
    });
    await customer.save();
    return { customer, isNew: true };
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<CustomerDocument | null> {
    return this.customerModel.findById(id).exec();
  }

  /**
   * Find all customers for a tenant with optional search
   */
  async findAll(filter: {
    tenantId: string;
    search?: string;
  }): Promise<CustomerDocument[]> {
    const query: any = { tenantId: filter.tenantId };

    if (filter.search) {
      const regex = new RegExp(filter.search, 'i');
      query.$or = [{ firstName: regex }, { lastName: regex }, { phone: regex }];
    }

    return this.customerModel
      .find(query)
      .sort({ lastVisitAt: -1 })
      .limit(200)
      .exec();
  }

  /**
   * Update a customer record
   */
  async update(
    id: string,
    updates: Partial<Customer>,
  ): Promise<CustomerDocument> {
    const customer = await this.customerModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .exec();
    if (!customer) {
      throw new RpcException(new NotFoundException('Customer not found'));
    }
    return customer;
  }

  /**
   * Delete a customer record
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const result = await this.customerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new RpcException(new NotFoundException('Customer not found'));
    }
    return { success: true };
  }

  /**
   * Find customer by telegram ID within a tenant
   */
  async findByTelegramId(
    tenantId: string,
    telegramId: string,
  ): Promise<CustomerDocument | null> {
    return this.customerModel.findOne({ tenantId, telegramId }).exec();
  }
}
