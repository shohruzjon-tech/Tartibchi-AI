import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { Queue, QueueDocument } from './schemas/queue.schema';

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(Queue.name) private queueModel: Model<QueueDocument>,
  ) {}

  async create(data: Partial<Queue>): Promise<QueueDocument> {
    try {
      const queue = new this.queueModel(data);
      return await queue.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new RpcException(
          new BadRequestException(
            'A queue with this prefix already exists for this branch',
          ),
        );
      }
      throw new RpcException(
        new BadRequestException(error.message || 'Failed to create queue'),
      );
    }
  }

  async findById(id: string): Promise<QueueDocument | null> {
    return this.queueModel.findById(id).exec();
  }

  async findAll(filter: {
    tenantId: string;
    branchId?: string;
  }): Promise<QueueDocument[]> {
    const query: any = { tenantId: filter.tenantId };
    if (filter.branchId) query.branchId = filter.branchId;
    return this.queueModel.find(query).exec();
  }

  async update(id: string, updates: Partial<Queue>): Promise<QueueDocument> {
    const queue = await this.queueModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .exec();
    if (!queue) {
      throw new RpcException(new NotFoundException('Queue not found'));
    }
    return queue;
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.queueModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new RpcException(new NotFoundException('Queue not found'));
    }
    return { deleted: true };
  }
}
