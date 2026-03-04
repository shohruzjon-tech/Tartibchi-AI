import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, APPOINTMENT_PATTERNS } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(APPOINTMENT_PATTERNS.CREATE, {
        ...body,
        tenantId: user.tenantId,
      }),
    );
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ) {
    return firstValueFrom(
      this.accountsClient.send(APPOINTMENT_PATTERNS.FIND_ALL, {
        tenantId: user.tenantId,
        date,
        status,
        branchId,
      }),
    );
  }

  @Get('daily/:date')
  async getDaily(@CurrentUser() user: any, @Param('date') date: string) {
    return firstValueFrom(
      this.accountsClient.send(APPOINTMENT_PATTERNS.GET_DAILY, {
        tenantId: user.tenantId,
        date,
      }),
    );
  }

  @Get('slots/:date')
  async getAvailableSlots(
    @CurrentUser() user: any,
    @Param('date') date: string,
  ) {
    return firstValueFrom(
      this.accountsClient.send(APPOINTMENT_PATTERNS.GET_AVAILABLE_SLOTS, {
        tenantId: user.tenantId,
        date,
      }),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.accountsClient.send(APPOINTMENT_PATTERNS.FIND_ONE, { id }),
    );
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(APPOINTMENT_PATTERNS.UPDATE, {
        id,
        updates: body,
      }),
    );
  }

  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return firstValueFrom(
      this.accountsClient.send(APPOINTMENT_PATTERNS.CANCEL, { id }),
    );
  }
}
