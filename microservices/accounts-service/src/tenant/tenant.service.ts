import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { TenantMode } from '@repo/shared';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async create(data: Partial<Tenant>): Promise<TenantDocument> {
    const slug = this.generateSlug(data.name!);
    const tenant = new this.tenantModel({ ...data, slug });
    return tenant.save();
  }

  async findById(id: string): Promise<TenantDocument | null> {
    return this.tenantModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<TenantDocument | null> {
    return this.tenantModel.findOne({ slug }).exec();
  }

  async findAll(): Promise<TenantDocument[]> {
    return this.tenantModel.find().exec();
  }

  async update(id: string, updates: Partial<Tenant>): Promise<TenantDocument> {
    const tenant = await this.tenantModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .exec();
    if (!tenant) {
      throw new RpcException(new NotFoundException('Tenant not found'));
    }
    return tenant;
  }

  async completeOnboarding(
    tenantId: string,
    mode: TenantMode,
    soloProfile?: Record<string, any>,
  ): Promise<TenantDocument> {
    const updates: Partial<Tenant> = {
      mode,
      onboardingCompleted: true,
    };

    if (mode === TenantMode.SOLO && soloProfile) {
      updates.soloProfile = soloProfile;
    }

    const tenant = await this.tenantModel
      .findByIdAndUpdate(tenantId, { $set: updates }, { new: true })
      .exec();

    if (!tenant) {
      throw new RpcException(new NotFoundException('Tenant not found'));
    }

    return tenant;
  }

  async switchMode(
    tenantId: string,
    mode: TenantMode,
    soloProfile?: Record<string, any>,
  ): Promise<TenantDocument> {
    const updates: any = { mode };

    if (mode === TenantMode.SOLO && soloProfile) {
      updates.soloProfile = soloProfile;
    }

    const tenant = await this.tenantModel
      .findByIdAndUpdate(tenantId, { $set: updates }, { new: true })
      .exec();

    if (!tenant) {
      throw new RpcException(new NotFoundException('Tenant not found'));
    }

    return tenant;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
