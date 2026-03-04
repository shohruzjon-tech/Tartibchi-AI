import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueGatewayModule } from './gateway/gateway.module';
import { EventsController } from './events/events.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    QueueGatewayModule,
  ],
  controllers: [EventsController],
})
export class AppModule {}
