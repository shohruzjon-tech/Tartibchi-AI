import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
    private readonly userService: UserService,
  ) {}

  async create(
    data: Partial<Counter> & { employeeId: string },
  ): Promise<{ counter: CounterDocument }> {
    try {
      // Validate employee exists
      const employee = await this.userService.findById(data.employeeId);
      if (!employee) {
        throw new RpcException(new BadRequestException('Employee not found'));
      }

      // Validate employee has a phone number
      if (!employee.phone) {
        throw new RpcException(
          new BadRequestException(
            'Employee must have a phone number to be assigned to a counter',
          ),
        );
      }

      // Check if employee is already assigned to another counter
      const existingCounter = await this.counterModel
        .findOne({ employeeId: data.employeeId })
        .exec();
      if (existingCounter) {
        throw new RpcException(
          new BadRequestException(
            'This employee is already assigned to another counter',
          ),
        );
      }

      const counter = new this.counterModel({
        ...data,
        login: employee.phone,
        staffId: data.employeeId,
      });
      const savedCounter = await counter.save();

      return { counter: savedCounter };
    } catch (error: any) {
      if (error instanceof RpcException) throw error;
      if (error.code === 11000) {
        if (error.message?.includes('employeeId')) {
          throw new RpcException(
            new BadRequestException(
              'This employee is already assigned to another counter',
            ),
          );
        }
        throw new RpcException(
          new BadRequestException(
            'A counter with this number already exists for this branch',
          ),
        );
      }
      throw new RpcException(
        new BadRequestException(error.message || 'Failed to create counter'),
      );
    }
  }

  async findById(id: string): Promise<CounterDocument | null> {
    return this.counterModel
      .findById(id)
      .populate('employeeId', 'firstName lastName phone email')
      .exec();
  }

  async findByLogin(login: string): Promise<CounterDocument[]> {
    return this.counterModel
      .find({ login, isActive: true })
      .populate('employeeId', 'firstName lastName phone email')
      .populate('branchId', 'name')
      .populate('tenantId', 'name')
      .exec();
  }

  async findAll(filter: {
    tenantId: string;
    branchId?: string;
  }): Promise<CounterDocument[]> {
    const query: any = { tenantId: filter.tenantId };
    if (filter.branchId) query.branchId = filter.branchId;
    return this.counterModel
      .find(query)
      .populate('employeeId', 'firstName lastName phone email')
      .exec();
  }

  async update(
    id: string,
    updates: Partial<Counter> & { employeeId?: string },
  ): Promise<{ counter: CounterDocument }> {
    try {
      // If changing employee, validate new employee
      if (updates.employeeId) {
        // Fetch the current counter to compare employeeId
        const currentCounter = await this.counterModel.findById(id).exec();
        if (!currentCounter) {
          throw new RpcException(new NotFoundException('Counter not found'));
        }

        const currentEmployeeId = currentCounter.employeeId?.toString();
        const newEmployeeId = updates.employeeId.toString();
        const employeeActuallyChanged = currentEmployeeId !== newEmployeeId;

        if (employeeActuallyChanged) {
          const employee = await this.userService.findById(updates.employeeId);
          if (!employee) {
            throw new RpcException(
              new BadRequestException('Employee not found'),
            );
          }

          if (!employee.phone) {
            throw new RpcException(
              new BadRequestException(
                'Employee must have a phone number to be assigned to a counter',
              ),
            );
          }

          // Check if this employee is already assigned to a different counter
          const existingCounter = await this.counterModel
            .findOne({
              employeeId: updates.employeeId,
              _id: { $ne: id },
            })
            .exec();
          if (existingCounter) {
            throw new RpcException(
              new BadRequestException(
                'This employee is already assigned to another counter',
              ),
            );
          }

          // Update login to new employee's phone
          updates = {
            ...updates,
            login: employee.phone,
            staffId: updates.employeeId,
          } as any;
        }
      }

      const counter = await this.counterModel
        .findByIdAndUpdate(id, { $set: updates }, { new: true })
        .populate('employeeId', 'firstName lastName phone email')
        .exec();
      if (!counter) {
        throw new RpcException(new NotFoundException('Counter not found'));
      }
      return { counter };
    } catch (error: any) {
      if (error instanceof RpcException) throw error;
      if (error.code === 11000) {
        if (error.message?.includes('employeeId')) {
          throw new RpcException(
            new BadRequestException(
              'This employee is already assigned to another counter',
            ),
          );
        }
        throw new RpcException(
          new BadRequestException(
            'A counter with this number already exists for this branch',
          ),
        );
      }
      throw new RpcException(
        new BadRequestException(error.message || 'Failed to update counter'),
      );
    }
  }
}
