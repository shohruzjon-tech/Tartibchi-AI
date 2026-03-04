import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { BranchModule } from './branch/branch.module';
import { UserModule } from './user/user.module';
import { CounterModule } from './counter/counter.module';
import { AttachmentModule } from './attachment/attachment.module';
import { AppointmentModule } from './appointment/appointment.module';
import { AiModule } from './ai/ai.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    TenantModule,
    BranchModule,
    UserModule,
    CounterModule,
    AttachmentModule,
    AppointmentModule,
    AiModule,
    CustomerModule,
  ],
})
export class AppModule {}
