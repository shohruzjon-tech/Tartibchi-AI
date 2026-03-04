import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, TICKET_PATTERNS, CUSTOMER_PATTERNS } from '@repo/shared';
import { Public } from '../decorators/public.decorator';

@Controller('tickets')
export class TicketController {
  constructor(
    @Inject(SERVICES.QUEUE) private readonly queueClient: ClientProxy,
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  @Post()
  @Public()
  async create(@Body() body: any) {
    // If customerPhone is provided, find-or-create customer in the accounts service
    if (body.customerPhone && body.tenantId) {
      try {
        const result = await firstValueFrom(
          this.accountsClient.send(CUSTOMER_PATTERNS.FIND_OR_CREATE, {
            tenantId: body.tenantId,
            phone: body.customerPhone,
            firstName: body.customerName,
            lastName: body.customerLastName,
            telegramId: body.customerTelegramId,
          }),
        );
        // Return customer info alongside ticket creation if customer is new
        const ticket = await firstValueFrom(
          this.queueClient.send(TICKET_PATTERNS.CREATE, body),
        );
        return {
          ...ticket,
          customer: result.customer,
          isNewCustomer: result.isNew,
        };
      } catch {
        // If customer service fails, still create the ticket
        return firstValueFrom(
          this.queueClient.send(TICKET_PATTERNS.CREATE, body),
        );
      }
    }
    return firstValueFrom(this.queueClient.send(TICKET_PATTERNS.CREATE, body));
  }

  @Get('check-customer')
  @Public()
  async checkCustomer(
    @Query('phone') phone: string,
    @Query('tenantId') tenantId: string,
  ) {
    if (!phone || !tenantId) return { exists: false };
    try {
      const customer = await firstValueFrom(
        this.accountsClient.send(CUSTOMER_PATTERNS.FIND_BY_PHONE, {
          tenantId,
          phone,
        }),
      );
      if (customer) {
        return {
          exists: true,
          firstName: customer.firstName,
          lastName: customer.lastName || '',
        };
      }
      return { exists: false };
    } catch {
      return { exists: false };
    }
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.queueClient.send(TICKET_PATTERNS.FIND_ONE, { id }),
    );
  }

  @Get('status/:publicId')
  @Public()
  async getStatus(@Param('publicId') publicId: string) {
    return firstValueFrom(
      this.queueClient.send(TICKET_PATTERNS.GET_STATUS, { publicId }),
    );
  }

  @Get('queue/:queueId')
  @Public()
  async getQueueTickets(
    @Param('queueId') queueId: string,
    @Query('tenantId') tenantId: string,
    @Query('branchId') branchId: string,
  ) {
    return firstValueFrom(
      this.queueClient.send(TICKET_PATTERNS.GET_QUEUE_TICKETS, {
        tenantId,
        branchId,
        queueId,
      }),
    );
  }

  @Get('wait/:publicId')
  @Public()
  async getEstimatedWait(@Param('publicId') publicId: string) {
    return firstValueFrom(
      this.queueClient.send(TICKET_PATTERNS.GET_ESTIMATED_WAIT, { publicId }),
    );
  }
}
