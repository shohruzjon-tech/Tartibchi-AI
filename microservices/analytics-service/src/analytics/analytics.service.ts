import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TicketEvent,
  TicketEventDocument,
} from './schemas/ticket-event.schema';
import { DailyStat, DailyStatDocument } from './schemas/daily-stat.schema';
import { TicketEventType } from '@repo/shared';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(TicketEvent.name)
    private ticketEventModel: Model<TicketEventDocument>,
    @InjectModel(DailyStat.name)
    private dailyStatModel: Model<DailyStatDocument>,
  ) {}

  async recordEvent(data: {
    ticketId: string;
    tenantId: string;
    branchId: string;
    queueId: string;
    counterId?: string;
    staffId?: string;
    type: TicketEventType;
    metadata?: Record<string, any>;
  }) {
    const event = new this.ticketEventModel({
      ...data,
      timestamp: new Date(),
    });
    await event.save();

    // Update daily stats aggregation
    await this.updateDailyStats(data);

    return event;
  }

  private async updateDailyStats(data: {
    tenantId: string;
    branchId: string;
    queueId: string;
    type: TicketEventType;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hour = new Date().getHours();

    const update: any = {};

    switch (data.type) {
      case TicketEventType.CREATED:
        update.$inc = { totalTickets: 1, [`hourlyDistribution.${hour}`]: 1 };
        break;
      case TicketEventType.COMPLETED:
        update.$inc = { totalServed: 1 };
        break;
      case TicketEventType.SKIPPED:
        update.$inc = { totalSkipped: 1 };
        break;
    }

    if (Object.keys(update).length > 0) {
      await this.dailyStatModel.findOneAndUpdate(
        {
          tenantId: data.tenantId,
          branchId: data.branchId,
          date: today,
        },
        {
          ...update,
          $setOnInsert: {
            tenantId: data.tenantId,
            branchId: data.branchId,
            queueId: data.queueId,
            date: today,
          },
        },
        { upsert: true, new: true },
      );
    }
  }

  async getDailyStats(data: {
    tenantId: string;
    branchId?: string;
    startDate: string;
    endDate: string;
  }) {
    const query: any = {
      tenantId: data.tenantId,
      date: {
        $gte: new Date(data.startDate),
        $lte: new Date(data.endDate),
      },
    };
    if (data.branchId) query.branchId = data.branchId;

    return this.dailyStatModel.find(query).sort({ date: 1 }).exec();
  }

  async getQueueStats(data: {
    tenantId: string;
    branchId?: string;
    queueId?: string;
    startDate: string;
    endDate: string;
  }) {
    const match: any = {
      tenantId: data.tenantId,
      timestamp: {
        $gte: new Date(data.startDate),
        $lte: new Date(data.endDate),
      },
    };
    if (data.branchId) match.branchId = data.branchId;
    if (data.queueId) match.queueId = data.queueId;

    return this.ticketEventModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { queueId: '$queueId', type: '$type' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.queueId',
          events: {
            $push: { type: '$_id.type', count: '$count' },
          },
          totalEvents: { $sum: '$count' },
        },
      },
    ]);
  }

  async getCounterStats(data: {
    tenantId: string;
    branchId?: string;
    counterId?: string;
    startDate: string;
    endDate: string;
  }) {
    const match: any = {
      tenantId: data.tenantId,
      counterId: { $exists: true },
      timestamp: {
        $gte: new Date(data.startDate),
        $lte: new Date(data.endDate),
      },
    };
    if (data.branchId) match.branchId = data.branchId;
    if (data.counterId) match.counterId = data.counterId;

    return this.ticketEventModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { counterId: '$counterId', type: '$type' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.counterId',
          events: {
            $push: { type: '$_id.type', count: '$count' },
          },
          totalEvents: { $sum: '$count' },
        },
      },
    ]);
  }

  async getBranchStats(data: {
    tenantId: string;
    branchId: string;
    startDate: string;
    endDate: string;
  }) {
    const stats = await this.dailyStatModel.aggregate([
      {
        $match: {
          tenantId: data.tenantId,
          branchId: data.branchId,
          date: {
            $gte: new Date(data.startDate),
            $lte: new Date(data.endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: '$totalTickets' },
          totalServed: { $sum: '$totalServed' },
          totalSkipped: { $sum: '$totalSkipped' },
          avgServiceTime: { $avg: '$avgServiceTime' },
          days: { $sum: 1 },
        },
      },
    ]);

    return (
      stats[0] || {
        totalTickets: 0,
        totalServed: 0,
        totalSkipped: 0,
        avgServiceTime: 0,
        days: 0,
      }
    );
  }

  async getPeakHours(data: {
    tenantId: string;
    branchId: string;
    startDate: string;
    endDate: string;
  }) {
    const stats = await this.dailyStatModel.aggregate([
      {
        $match: {
          tenantId: data.tenantId,
          branchId: data.branchId,
          date: {
            $gte: new Date(data.startDate),
            $lte: new Date(data.endDate),
          },
        },
      },
      {
        $project: {
          hourlyDistribution: { $objectToArray: '$hourlyDistribution' },
        },
      },
      { $unwind: '$hourlyDistribution' },
      {
        $group: {
          _id: '$hourlyDistribution.k',
          totalTickets: { $sum: '$hourlyDistribution.v' },
        },
      },
      { $sort: { totalTickets: -1 } },
    ]);

    return stats.map((s) => ({
      hour: parseInt(s._id),
      totalTickets: s.totalTickets,
    }));
  }

  /**
   * Dashboard summary — aggregates today vs yesterday comparison,
   * weekly trend, completion rate, and top queues in a single call.
   *
   * When startDate / endDate are provided the summary covers that
   * custom range and compares it with the equally-long previous period.
   * When omitted the legacy behaviour is preserved (today vs yesterday,
   * last-7-day trend).
   */
  async getDashboardSummary(data: {
    tenantId: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const now = new Date();
    const baseMatch: any = { tenantId: data.tenantId };
    if (data.branchId) baseMatch.branchId = data.branchId;

    const hasCustomRange = !!data.startDate && !!data.endDate;

    /* ── Determine primary & comparison windows ────────────── */
    let primaryStart: Date;
    let primaryEnd: Date;
    let comparisonStart: Date;
    let comparisonEnd: Date;
    let trendStart: Date;

    if (hasCustomRange) {
      primaryStart = new Date(data.startDate!);
      primaryStart.setHours(0, 0, 0, 0);
      primaryEnd = new Date(data.endDate!);
      primaryEnd.setHours(23, 59, 59, 999);
      const rangeDays =
        Math.round(
          (primaryEnd.getTime() - primaryStart.getTime()) / 86_400_000,
        ) + 1;
      comparisonEnd = new Date(primaryStart);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);
      comparisonEnd.setHours(23, 59, 59, 999);
      comparisonStart = new Date(comparisonEnd);
      comparisonStart.setDate(comparisonStart.getDate() - rangeDays + 1);
      comparisonStart.setHours(0, 0, 0, 0);
      trendStart = primaryStart;
    } else {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      primaryStart = todayStart;
      primaryEnd = now;
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      comparisonStart = yesterdayStart;
      comparisonEnd = new Date(todayStart);
      comparisonEnd.setMilliseconds(-1);
      trendStart = new Date(todayStart);
      trendStart.setDate(trendStart.getDate() - 7);
    }

    // Primary period stats
    const primaryStats = await this.dailyStatModel.aggregate([
      {
        $match: {
          ...baseMatch,
          date: { $gte: primaryStart, $lte: primaryEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: '$totalTickets' },
          totalServed: { $sum: '$totalServed' },
          totalSkipped: { $sum: '$totalSkipped' },
          avgServiceTime: { $avg: '$avgServiceTime' },
        },
      },
    ]);

    // Comparison period stats
    const comparisonStats = await this.dailyStatModel.aggregate([
      {
        $match: {
          ...baseMatch,
          date: { $gte: comparisonStart, $lte: comparisonEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: '$totalTickets' },
          totalServed: { $sum: '$totalServed' },
          totalSkipped: { $sum: '$totalSkipped' },
          avgServiceTime: { $avg: '$avgServiceTime' },
        },
      },
    ]);

    // Trend (daily breakdown) for the selected window
    const weeklyTrend = await this.dailyStatModel.aggregate([
      {
        $match: {
          ...baseMatch,
          date: {
            $gte: trendStart,
            ...(hasCustomRange ? { $lte: primaryEnd } : {}),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalTickets: { $sum: '$totalTickets' },
          totalServed: { $sum: '$totalServed' },
          totalSkipped: { $sum: '$totalSkipped' },
          avgServiceTime: { $avg: '$avgServiceTime' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Peak hours for the window
    const peakHoursMatch = hasCustomRange
      ? { ...baseMatch, date: { $gte: primaryStart, $lte: primaryEnd } }
      : { ...baseMatch, date: { $gte: primaryStart } };

    const periodPeakHours = await this.dailyStatModel.aggregate([
      { $match: peakHoursMatch },
      {
        $project: {
          hourlyDistribution: { $objectToArray: '$hourlyDistribution' },
        },
      },
      { $unwind: '$hourlyDistribution' },
      {
        $group: {
          _id: '$hourlyDistribution.k',
          count: { $sum: '$hourlyDistribution.v' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Top queues by ticket count
    const topQueues = await this.ticketEventModel.aggregate([
      {
        $match: {
          ...baseMatch,
          type: TicketEventType.CREATED,
          timestamp: {
            $gte: hasCustomRange ? primaryStart : trendStart,
            ...(hasCustomRange ? { $lte: primaryEnd } : {}),
          },
        },
      },
      { $group: { _id: '$queueId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Completion rate
    const completionData = await this.ticketEventModel.aggregate([
      {
        $match: {
          ...baseMatch,
          type: {
            $in: [
              TicketEventType.COMPLETED,
              TicketEventType.SKIPPED,
              TicketEventType.CREATED,
            ],
          },
          timestamp: {
            $gte: hasCustomRange ? primaryStart : trendStart,
            ...(hasCustomRange ? { $lte: primaryEnd } : {}),
          },
        },
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const primary = primaryStats[0] || {
      totalTickets: 0,
      totalServed: 0,
      totalSkipped: 0,
      avgServiceTime: 0,
    };
    const comparison = comparisonStats[0] || {
      totalTickets: 0,
      totalServed: 0,
      totalSkipped: 0,
      avgServiceTime: 0,
    };

    const completionMap: Record<string, number> = {};
    for (const c of completionData) completionMap[c._id] = c.count;

    return {
      today: {
        totalTickets: primary.totalTickets,
        totalServed: primary.totalServed,
        totalSkipped: primary.totalSkipped,
        totalWaiting: Math.max(
          0,
          primary.totalTickets - primary.totalServed - primary.totalSkipped,
        ),
        avgServiceTime: primary.avgServiceTime || 0,
      },
      yesterday: {
        totalTickets: comparison.totalTickets,
        totalServed: comparison.totalServed,
        totalSkipped: comparison.totalSkipped,
        avgServiceTime: comparison.avgServiceTime || 0,
      },
      weeklyTrend: weeklyTrend.map((d) => ({
        date: d._id,
        totalTickets: d.totalTickets,
        totalServed: d.totalServed,
        totalSkipped: d.totalSkipped,
        avgServiceTime: Math.round((d.avgServiceTime || 0) / 60),
      })),
      peakHours: periodPeakHours.map((p) => ({
        hour: parseInt(p._id),
        count: p.count,
      })),
      topQueues,
      completionRate: {
        completed: completionMap[TicketEventType.COMPLETED] || 0,
        skipped: completionMap[TicketEventType.SKIPPED] || 0,
        total: completionMap[TicketEventType.CREATED] || 0,
      },
    };
  }

  /**
   * Employee (counter/staff) performance — aggregation of served/skipped by staffId
   */
  async getEmployeePerformance(data: {
    tenantId: string;
    branchId?: string;
    startDate: string;
    endDate: string;
  }) {
    const match: any = {
      tenantId: data.tenantId,
      staffId: { $exists: true, $ne: null },
      type: {
        $in: [
          TicketEventType.COMPLETED,
          TicketEventType.SKIPPED,
          TicketEventType.SERVING_STARTED,
        ],
      },
      timestamp: {
        $gte: new Date(data.startDate),
        $lte: new Date(data.endDate + 'T23:59:59.999Z'),
      },
    };
    if (data.branchId) match.branchId = data.branchId;

    const results = await this.ticketEventModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { staffId: '$staffId', type: '$type' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.staffId',
          events: { $push: { type: '$_id.type', count: '$count' } },
          totalEvents: { $sum: '$count' },
        },
      },
      { $sort: { totalEvents: -1 } },
    ]);

    return results.map((r) => {
      const eventMap: Record<string, number> = {};
      for (const e of r.events) eventMap[e.type] = e.count;
      return {
        staffId: r._id,
        served: eventMap[TicketEventType.COMPLETED] || 0,
        skipped: eventMap[TicketEventType.SKIPPED] || 0,
        started: eventMap[TicketEventType.SERVING_STARTED] || 0,
        totalEvents: r.totalEvents,
      };
    });
  }
}
