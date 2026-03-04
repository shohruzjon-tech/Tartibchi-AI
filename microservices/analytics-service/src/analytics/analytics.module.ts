import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TicketEvent, TicketEventSchema } from './schemas/ticket-event.schema';
import { DailyStat, DailyStatSchema } from './schemas/daily-stat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TicketEvent.name, schema: TicketEventSchema },
      { name: DailyStat.name, schema: DailyStatSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
