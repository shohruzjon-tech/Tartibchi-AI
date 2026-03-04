import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICES, SERVICE_PORTS } from '@repo/shared';
import { BotModule } from './bot/bot.module';

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
    ]),
    BotModule,
  ],
})
export class AppModule {}
