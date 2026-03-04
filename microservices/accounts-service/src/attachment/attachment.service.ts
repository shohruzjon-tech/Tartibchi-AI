import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { Attachment, AttachmentDocument } from './schemas/attachment.schema';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectModel(Attachment.name)
    private attachmentModel: Model<AttachmentDocument>,
  ) {}

  async create(data: Partial<Attachment>): Promise<AttachmentDocument> {
    const attachment = new this.attachmentModel(data);
    return attachment.save();
  }

  async findByUser(userId: string): Promise<AttachmentDocument[]> {
    return this.attachmentModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async delete(id: string): Promise<AttachmentDocument> {
    const attachment = await this.attachmentModel.findByIdAndDelete(id).exec();
    if (!attachment) {
      throw new RpcException('Attachment not found');
    }
    return attachment;
  }
}
