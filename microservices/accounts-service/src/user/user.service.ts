import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument[]> {
    return this.userModel.find({ phone }).exec();
  }

  async findAll(filter: {
    tenantId?: string;
    branchId?: string;
  }): Promise<UserDocument[]> {
    const query: any = {};
    if (filter.tenantId) query.tenantId = filter.tenantId;
    if (filter.branchId) query.branchId = filter.branchId;
    return this.userModel.find(query).select('-password').exec();
  }

  async update(id: string, updates: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .select('-password')
      .exec();
    if (!user) {
      throw new RpcException(new NotFoundException('User not found'));
    }
    return user;
  }
}
