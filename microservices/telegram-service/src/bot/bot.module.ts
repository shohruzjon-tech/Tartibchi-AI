import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SERVICES, SERVICE_PORTS } from '@repo/shared';
import { BotController } from './bot.controller';
import { BotManagerService } from './bot-manager.service';
import { TelegramBot, TelegramBotSchema } from './schemas/telegram-bot.schema';
import {
  TelegramUser,
  TelegramUserSchema,
} from './schemas/telegram-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TelegramBot.name, schema: TelegramBotSchema },
      { name: TelegramUser.name, schema: TelegramUserSchema },
    ]),
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
    ]),
  ],
  controllers: [BotController],
  providers: [BotManagerService],
  exports: [BotManagerService],
})
export class BotModule {}
