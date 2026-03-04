import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { SERVICES, SERVICE_PORTS } from '@repo/shared';
import { AuthController } from './controllers/auth.controller';
import { TenantController } from './controllers/tenant.controller';
import { BranchController } from './controllers/branch.controller';
import { QueueController } from './controllers/queue.controller';
import { TicketController } from './controllers/ticket.controller';
import { CounterController } from './controllers/counter.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { TelegramController } from './controllers/telegram.controller';
import { UserController } from './controllers/user.controller';
import { DocumentController } from './controllers/document.controller';
import { StaffAuthController } from './controllers/staff-auth.controller';
import { AppointmentController } from './controllers/appointment.controller';
import { AiController } from './controllers/ai.controller';
import { CustomerController } from './controllers/customer.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET')!,
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: SERVICES.ACCOUNTS,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>(
              'ACCOUNTS_SERVICE_HOST',
              'localhost',
            ),
            port: configService.get<number>(
              'ACCOUNTS_SERVICE_PORT',
              SERVICE_PORTS.ACCOUNTS,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SERVICES.QUEUE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('QUEUE_SERVICE_HOST', 'localhost'),
            port: configService.get<number>(
              'QUEUE_SERVICE_PORT',
              SERVICE_PORTS.QUEUE,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SERVICES.NOTIFICATION,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>(
              'NOTIFICATION_SERVICE_HOST',
              'localhost',
            ),
            port: configService.get<number>(
              'NOTIFICATION_SERVICE_PORT',
              SERVICE_PORTS.NOTIFICATION,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SERVICES.ANALYTICS,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>(
              'ANALYTICS_SERVICE_HOST',
              'localhost',
            ),
            port: configService.get<number>(
              'ANALYTICS_SERVICE_PORT',
              SERVICE_PORTS.ANALYTICS,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SERVICES.TELEGRAM,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>(
              'TELEGRAM_SERVICE_HOST',
              'localhost',
            ),
            port: configService.get<number>(
              'TELEGRAM_SERVICE_PORT',
              SERVICE_PORTS.TELEGRAM,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SERVICES.WEBSOCKET,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>(
              'WEBSOCKET_SERVICE_HOST',
              'localhost',
            ),
            port:
              parseInt(
                configService.get<string>('WEBSOCKET_SERVICE_PORT', '5006'),
                10,
              ) + 100,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    AuthController,
    TenantController,
    BranchController,
    QueueController,
    TicketController,
    CounterController,
    AnalyticsController,
    TelegramController,
    UserController,
    DocumentController,
    StaffAuthController,
    AppointmentController,
    AiController,
    CustomerController,
  ],
  providers: [JwtStrategy, JwtAuthGuard],
})
export class AppModule {}
