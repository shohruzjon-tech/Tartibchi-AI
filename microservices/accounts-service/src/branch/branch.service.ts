import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { Branch, BranchDocument } from './schemas/branch.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class BranchService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * If managerId is provided, look up the employee and set managerName automatically.
   */
  private async resolveManagerName(
    data: Partial<Branch>,
  ): Promise<Partial<Branch>> {
    if (data.managerId) {
      const manager = await this.userModel
        .findById(data.managerId)
        .select('firstName lastName')
        .lean()
        .exec();
      if (manager) {
        data.managerName = `${manager.firstName} ${manager.lastName}`.trim();
      }
    } else if (data.managerId === null || data.managerId === ('' as any)) {
      // Explicitly clearing the manager
      data.managerId = undefined as any;
      data.managerName = '';
    }
    return data;
  }

  async create(data: Partial<Branch>): Promise<BranchDocument> {
    try {
      await this.resolveManagerName(data);
      const branch = new this.branchModel(data);
      const saved = await branch.save();
      return this.populateBranch(saved);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new RpcException(
          new BadRequestException(
            'A branch with this name already exists for this tenant',
          ),
        );
      }
      throw new RpcException(
        new BadRequestException(error.message || 'Failed to create branch'),
      );
    }
  }

  async findById(id: string): Promise<BranchDocument | null> {
    return this.branchModel
      .findById(id)
      .populate('managerId', 'firstName lastName email phone role')
      .exec();
  }

  async findBySlug(slug: string): Promise<BranchDocument | null> {
    return this.branchModel.findOne({ slug, isActive: true }).exec();
  }

  async findByTenant(tenantId: string): Promise<BranchDocument[]> {
    return this.branchModel
      .find({ tenantId })
      .populate('managerId', 'firstName lastName email phone role')
      .exec();
  }

  async update(id: string, updates: Partial<Branch>): Promise<BranchDocument> {
    await this.resolveManagerName(updates);
    const branch = await this.branchModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('managerId', 'firstName lastName email phone role')
      .exec();
    if (!branch) {
      throw new RpcException(new NotFoundException('Branch not found'));
    }
    return branch;
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.branchModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new RpcException(new NotFoundException('Branch not found'));
    }
    return { deleted: true };
  }

  private async populateBranch(
    branch: BranchDocument,
  ): Promise<BranchDocument> {
    return branch.populate('managerId', 'firstName lastName email phone role');
  }
}
