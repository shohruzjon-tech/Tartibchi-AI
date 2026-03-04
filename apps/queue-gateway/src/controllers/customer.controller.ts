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
import { SERVICES, CUSTOMER_PATTERNS } from '@repo/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(CUSTOMER_PATTERNS.CREATE, {
        ...body,
        tenantId: user.tenantId,
      }),
    );
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    return firstValueFrom(
      this.accountsClient.send(CUSTOMER_PATTERNS.FIND_ALL, {
        tenantId: user.tenantId,
        search,
      }),
    );
  }

  @Get('by-phone/:phone')
  async findByPhone(@CurrentUser() user: any, @Param('phone') phone: string) {
    return firstValueFrom(
      this.accountsClient.send(CUSTOMER_PATTERNS.FIND_BY_PHONE, {
        tenantId: user.tenantId,
        phone,
      }),
    );
  }

  @Post('find-or-create')
  async findOrCreate(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(CUSTOMER_PATTERNS.FIND_OR_CREATE, {
        ...body,
        tenantId: user.tenantId,
      }),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.accountsClient.send(CUSTOMER_PATTERNS.FIND_ONE, { id }),
    );
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(CUSTOMER_PATTERNS.UPDATE, {
        id,
        updates: body,
      }),
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return firstValueFrom(
      this.accountsClient.send(CUSTOMER_PATTERNS.DELETE, { id }),
    );
  }
}
