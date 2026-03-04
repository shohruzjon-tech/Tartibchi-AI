import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { TenantService } from '../tenant/tenant.service';
import { AppointmentStatus } from '@repo/shared';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    private readonly tenantService: TenantService,
  ) {}

  async create(data: Partial<Appointment>): Promise<AppointmentDocument> {
    // Check for time-slot conflict
    const existing = await this.appointmentModel
      .findOne({
        tenantId: data.tenantId,
        date: data.date,
        timeSlot: data.timeSlot,
        status: {
          $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      })
      .exec();

    if (existing) {
      throw new RpcException(
        new BadRequestException('This time slot is already booked'),
      );
    }

    const appointment = new this.appointmentModel({
      ...data,
      status: data.status || AppointmentStatus.PENDING,
    });
    return appointment.save();
  }

  async findById(id: string): Promise<AppointmentDocument | null> {
    return this.appointmentModel.findById(id).exec();
  }

  async findByTenant(
    tenantId: string,
    filter?: { date?: string; status?: string; branchId?: string },
  ): Promise<AppointmentDocument[]> {
    const query: any = { tenantId };
    if (filter?.date) query.date = filter.date;
    if (filter?.status) query.status = filter.status;
    if (filter?.branchId) query.branchId = filter.branchId;
    return this.appointmentModel
      .find(query)
      .sort({ date: 1, timeSlot: 1 })
      .exec();
  }

  async findDaily(
    tenantId: string,
    date: string,
  ): Promise<AppointmentDocument[]> {
    return this.appointmentModel
      .find({
        tenantId,
        date,
        status: {
          $nin: [AppointmentStatus.CANCELLED],
        },
      })
      .sort({ timeSlot: 1 })
      .exec();
  }

  async update(
    id: string,
    updates: Partial<Appointment>,
  ): Promise<AppointmentDocument> {
    // If changing time slot, check for conflicts
    if (updates.date || updates.timeSlot) {
      const current = await this.appointmentModel.findById(id).exec();
      if (!current) {
        throw new RpcException(new NotFoundException('Appointment not found'));
      }

      const checkDate = updates.date || current.date;
      const checkSlot = updates.timeSlot || current.timeSlot;

      const conflict = await this.appointmentModel
        .findOne({
          _id: { $ne: id },
          tenantId: current.tenantId,
          date: checkDate,
          timeSlot: checkSlot,
          status: {
            $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
          },
        })
        .exec();

      if (conflict) {
        throw new RpcException(
          new BadRequestException('This time slot is already booked'),
        );
      }
    }

    const appointment = await this.appointmentModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .exec();

    if (!appointment) {
      throw new RpcException(new NotFoundException('Appointment not found'));
    }

    return appointment;
  }

  async cancel(id: string): Promise<AppointmentDocument> {
    return this.update(id, { status: AppointmentStatus.CANCELLED } as any);
  }

  async getAvailableSlots(
    tenantId: string,
    date: string,
  ): Promise<{ time: string; available: boolean }[]> {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      throw new RpcException(new NotFoundException('Tenant not found'));
    }

    const profile = tenant.soloProfile || {};
    const slotDuration = profile.slotDuration || 30;
    const breakTime = profile.breakBetweenSlots || 0;

    // Determine working hours for the given day
    const dayOfWeek = new Date(date)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    const dayHours = profile.workingHours?.[dayOfWeek];
    const startTime = dayHours?.start || '09:00';
    const endTime = dayHours?.end || '18:00';
    const isClosed = dayHours?.closed || false;

    if (isClosed) return [];

    // Generate all possible slots
    const slots: { time: string; available: boolean }[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (
      let m = startMinutes;
      m + slotDuration <= endMinutes;
      m += slotDuration + breakTime
    ) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push({
        time: `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        available: true,
      });
    }

    // Get booked slots for this date
    const booked = await this.appointmentModel
      .find({
        tenantId,
        date,
        status: {
          $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      })
      .select('timeSlot')
      .exec();

    const bookedTimes = new Set(booked.map((a) => a.timeSlot));

    // Mark booked slots as unavailable
    for (const slot of slots) {
      if (bookedTimes.has(slot.time)) {
        slot.available = false;
      }
    }

    return slots;
  }
}
