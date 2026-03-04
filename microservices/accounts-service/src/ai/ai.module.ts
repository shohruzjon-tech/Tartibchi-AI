import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TenantModule } from '../tenant/tenant.module';
import { AppointmentModule } from '../appointment/appointment.module';

@Module({
  imports: [ConfigModule, TenantModule, AppointmentModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
