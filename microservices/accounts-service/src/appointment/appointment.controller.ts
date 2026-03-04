import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { APPOINTMENT_PATTERNS } from '@repo/shared';
import { AppointmentService } from './appointment.service';

@Controller()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @MessagePattern(APPOINTMENT_PATTERNS.CREATE)
  async create(@Payload() data: any) {
    return this.appointmentService.create(data);
  }

  @MessagePattern(APPOINTMENT_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    return this.appointmentService.findById(data.id);
  }

  @MessagePattern(APPOINTMENT_PATTERNS.FIND_ALL)
  async findAll(
    @Payload()
    data: {
      tenantId: string;
      date?: string;
      status?: string;
      branchId?: string;
    },
  ) {
    const { tenantId, ...filter } = data;
    return this.appointmentService.findByTenant(tenantId, filter);
  }

  @MessagePattern(APPOINTMENT_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; updates: any }) {
    return this.appointmentService.update(data.id, data.updates);
  }

  @MessagePattern(APPOINTMENT_PATTERNS.CANCEL)
  async cancel(@Payload() data: { id: string }) {
    return this.appointmentService.cancel(data.id);
  }

  @MessagePattern(APPOINTMENT_PATTERNS.GET_AVAILABLE_SLOTS)
  async getAvailableSlots(@Payload() data: { tenantId: string; date: string }) {
    return this.appointmentService.getAvailableSlots(data.tenantId, data.date);
  }

  @MessagePattern(APPOINTMENT_PATTERNS.GET_DAILY)
  async getDaily(@Payload() data: { tenantId: string; date: string }) {
    return this.appointmentService.findDaily(data.tenantId, data.date);
  }
}
