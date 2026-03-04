import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { TicketStatus, isValidTransition, QueueStrategy } from '@repo/shared';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { RedisService } from '../redis/redis.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    private readonly redisService: RedisService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Create a new ticket and enqueue it
   * Atomic operation: INCR counter → Create in Mongo → LPUSH to Redis
   */
  async createTicket(data: {
    tenantId: string;
    branchId: string;
    queueId: string;
    customerPhone?: string;
    customerTelegramId?: string;
    priority?: number;
  }): Promise<TicketDocument> {
    const queue = await this.queueService.findById(data.queueId);
    if (!queue || !queue.isActive) {
      throw new RpcException(
        new BadRequestException('Queue not found or inactive'),
      );
    }

    // Get next ticket number (atomic Redis INCR)
    const ticketNumber = await this.redisService.getNextTicketNumber(
      data.tenantId,
      data.branchId,
      data.queueId,
    );

    const displayNumber = `${queue.prefix}${String(ticketNumber).padStart(3, '0')}`;
    const publicId = uuidv4().substring(0, 8).toUpperCase();

    // Create ticket in MongoDB
    const ticket = new this.ticketModel({
      tenantId: data.tenantId,
      branchId: data.branchId,
      queueId: data.queueId,
      publicId,
      number: ticketNumber,
      displayNumber,
      status: TicketStatus.CREATED,
      customerPhone: data.customerPhone,
      customerTelegramId: data.customerTelegramId,
      priority: data.priority || 10,
    });

    await ticket.save();

    // Enqueue in Redis
    if (queue.strategy === QueueStrategy.PRIORITY) {
      await this.redisService.enqueuePriority(
        data.tenantId,
        data.branchId,
        data.queueId,
        ticket._id.toString(),
        data.priority || 10,
      );
    } else {
      await this.redisService.enqueue(
        data.tenantId,
        data.branchId,
        data.queueId,
        ticket._id.toString(),
      );
    }

    // Update status to WAITING
    ticket.status = TicketStatus.WAITING;
    await ticket.save();

    // Store metadata in Redis for fast access
    await this.redisService.setTicketMeta(ticket._id.toString(), {
      publicId,
      displayNumber,
      queueId: data.queueId,
      tenantId: data.tenantId,
      branchId: data.branchId,
      status: TicketStatus.WAITING,
    });

    this.logger.log(`Ticket ${displayNumber} created for queue ${queue.name}`);
    return ticket;
  }

  async findById(id: string): Promise<TicketDocument | null> {
    return this.ticketModel.findById(id).exec();
  }

  async getTicketStatus(publicId: string) {
    const ticket = await this.ticketModel.findOne({ publicId }).exec();
    if (!ticket) {
      throw new RpcException(new NotFoundException('Ticket not found'));
    }

    let position = -1;
    let estimatedWaitMs = 0;

    if (ticket.status === TicketStatus.WAITING) {
      position = await this.redisService.getTicketPosition(
        ticket.tenantId.toString(),
        ticket.branchId.toString(),
        ticket.queueId.toString(),
        ticket._id.toString(),
      );
      estimatedWaitMs = await this.redisService.getEstimatedWaitTime(
        ticket.tenantId.toString(),
        ticket.branchId.toString(),
        ticket.queueId.toString(),
        position >= 0 ? position : 0,
      );
    }

    return {
      publicId: ticket.publicId,
      displayNumber: ticket.displayNumber,
      status: ticket.status,
      position: position >= 0 ? position + 1 : null,
      estimatedWaitMinutes: Math.ceil(estimatedWaitMs / 60000),
      counterId: ticket.counterId,
      createdAt: ticket.createdAt,
    };
  }

  async getQueueTickets(data: {
    tenantId: string;
    branchId: string;
    queueId: string;
  }) {
    const ticketIds = await this.redisService.getQueueTickets(
      data.tenantId,
      data.branchId,
      data.queueId,
    );

    const tickets = await this.ticketModel
      .find({ _id: { $in: ticketIds } })
      .sort({ createdAt: 1 })
      .exec();

    const queueLength = ticketIds.length;
    return { tickets, queueLength };
  }

  async getEstimatedWait(publicId: string) {
    const ticket = await this.ticketModel.findOne({ publicId }).exec();
    if (!ticket) {
      throw new RpcException(new NotFoundException('Ticket not found'));
    }

    const position = await this.redisService.getTicketPosition(
      ticket.tenantId.toString(),
      ticket.branchId.toString(),
      ticket.queueId.toString(),
      ticket._id.toString(),
    );

    const estimatedWaitMs = await this.redisService.getEstimatedWaitTime(
      ticket.tenantId.toString(),
      ticket.branchId.toString(),
      ticket.queueId.toString(),
      position >= 0 ? position : 0,
    );

    return {
      publicId,
      position: position >= 0 ? position + 1 : null,
      estimatedWaitMinutes: Math.ceil(estimatedWaitMs / 60000),
    };
  }

  // ======== STAFF COUNTER ACTIONS ========

  /**
   * Call next ticket from queue
   * Uses distributed lock to prevent double-calling
   */
  async callNext(data: {
    counterId: string;
    tenantId: string;
    branchId: string;
    staffId?: string;
  }) {
    const lock = await this.redisService.acquireLock(
      `counter:${data.counterId}`,
      5000,
    );

    try {
      // Get counter's assigned queues from Redis state
      const counterState = await this.redisService.getCounterState(
        data.tenantId,
        data.branchId,
        data.counterId,
      );

      const queueIds = counterState.queueIds
        ? JSON.parse(counterState.queueIds)
        : [];
      if (queueIds.length === 0) {
        throw new RpcException(
          new BadRequestException('Counter has no assigned queues'),
        );
      }

      // Try to dequeue from each assigned queue
      let ticketId: string | null = null;
      let fromQueueId: string | null = null;

      for (const queueId of queueIds) {
        const queue = await this.queueService.findById(queueId);
        if (!queue) continue;

        if (queue.strategy === QueueStrategy.PRIORITY) {
          ticketId = await this.redisService.dequeuePriority(
            data.tenantId,
            data.branchId,
            queueId,
          );
        } else {
          ticketId = await this.redisService.dequeue(
            data.tenantId,
            data.branchId,
            queueId,
          );
        }

        if (ticketId) {
          fromQueueId = queueId;
          break;
        }
      }

      if (!ticketId) {
        return { ticket: null, message: 'No tickets in queue' };
      }

      // Update ticket status
      const ticket = await this.transitionTicket(
        ticketId,
        TicketStatus.CALLED,
        {
          counterId: data.counterId,
          calledAt: new Date(),
        },
      );

      // Update counter state in Redis
      await this.redisService.setCounterState(
        data.tenantId,
        data.branchId,
        data.counterId,
        {
          currentTicketId: ticketId,
          status: 'CALLING',
          lastCalledAt: new Date().toISOString(),
        },
      );

      this.logger.log(
        `Ticket ${ticket.displayNumber} called to counter ${data.counterId}`,
      );

      return { ticket, queueId: fromQueueId };
    } finally {
      await lock.release();
    }
  }

  /** Recall the last called ticket */
  async recallTicket(data: {
    counterId: string;
    tenantId: string;
    branchId: string;
  }) {
    const counterState = await this.redisService.getCounterState(
      data.tenantId,
      data.branchId,
      data.counterId,
    );

    if (!counterState.currentTicketId) {
      throw new RpcException(
        new BadRequestException('No current ticket to recall'),
      );
    }

    const ticket = await this.findById(counterState.currentTicketId);
    if (!ticket || ticket.status !== TicketStatus.CALLED) {
      throw new RpcException(
        new BadRequestException('Ticket cannot be recalled'),
      );
    }

    // Just re-emit the call event (ticket stays in CALLED state)
    this.logger.log(
      `Ticket ${ticket.displayNumber} recalled at counter ${data.counterId}`,
    );
    return { ticket, action: 'recalled' };
  }

  /** Skip current ticket */
  async skipTicket(data: {
    counterId: string;
    tenantId: string;
    branchId: string;
  }) {
    const counterState = await this.redisService.getCounterState(
      data.tenantId,
      data.branchId,
      data.counterId,
    );

    if (!counterState.currentTicketId) {
      throw new RpcException(
        new BadRequestException('No current ticket to skip'),
      );
    }

    const ticket = await this.transitionTicket(
      counterState.currentTicketId,
      TicketStatus.SKIPPED,
    );

    // Clear counter state
    await this.redisService.setCounterState(
      data.tenantId,
      data.branchId,
      data.counterId,
      {
        currentTicketId: '',
        status: 'IDLE',
      },
    );

    this.logger.log(
      `Ticket ${ticket.displayNumber} skipped at counter ${data.counterId}`,
    );
    return { ticket, action: 'skipped' };
  }

  /** Start serving the called ticket */
  async startServing(data: {
    counterId: string;
    tenantId: string;
    branchId: string;
  }) {
    const counterState = await this.redisService.getCounterState(
      data.tenantId,
      data.branchId,
      data.counterId,
    );

    if (!counterState.currentTicketId) {
      throw new RpcException(new BadRequestException('No current ticket'));
    }

    const ticket = await this.transitionTicket(
      counterState.currentTicketId,
      TicketStatus.SERVING,
      { servingStartedAt: new Date() },
    );

    await this.redisService.setCounterState(
      data.tenantId,
      data.branchId,
      data.counterId,
      {
        currentTicketId: counterState.currentTicketId,
        status: 'SERVING',
        servingStartedAt: new Date().toISOString(),
      },
    );

    this.logger.log(
      `Ticket ${ticket.displayNumber} being served at counter ${data.counterId}`,
    );
    return { ticket, action: 'serving' };
  }

  /** Complete the current ticket */
  async completeTicket(data: {
    counterId: string;
    tenantId: string;
    branchId: string;
  }) {
    const counterState = await this.redisService.getCounterState(
      data.tenantId,
      data.branchId,
      data.counterId,
    );

    if (!counterState.currentTicketId) {
      throw new RpcException(new BadRequestException('No current ticket'));
    }

    const ticket = await this.transitionTicket(
      counterState.currentTicketId,
      TicketStatus.DONE,
      { completedAt: new Date() },
    );

    // Update service time stats
    if (ticket.servingStartedAt) {
      const serviceTime =
        Date.now() - new Date(ticket.servingStartedAt).getTime();
      await this.redisService.updateServiceStats(
        data.tenantId,
        data.branchId,
        ticket.queueId.toString(),
        serviceTime,
      );
    }

    // Clear counter state
    await this.redisService.setCounterState(
      data.tenantId,
      data.branchId,
      data.counterId,
      {
        currentTicketId: '',
        status: 'IDLE',
      },
    );

    // Clean up Redis metadata
    await this.redisService.deleteTicketMeta(counterState.currentTicketId);

    this.logger.log(
      `Ticket ${ticket.displayNumber} completed at counter ${data.counterId}`,
    );
    return { ticket, action: 'done' };
  }

  /** Transfer ticket to another queue */
  async transferTicket(data: {
    counterId: string;
    tenantId: string;
    branchId: string;
    targetQueueId: string;
  }) {
    const counterState = await this.redisService.getCounterState(
      data.tenantId,
      data.branchId,
      data.counterId,
    );

    if (!counterState.currentTicketId) {
      throw new RpcException(
        new BadRequestException('No current ticket to transfer'),
      );
    }

    const ticket = await this.findById(counterState.currentTicketId);
    if (!ticket) {
      throw new RpcException(new NotFoundException('Ticket not found'));
    }

    const targetQueue = await this.queueService.findById(data.targetQueueId);
    if (!targetQueue || !targetQueue.isActive) {
      throw new RpcException(
        new BadRequestException('Target queue not found or inactive'),
      );
    }

    // Update ticket with new queue
    ticket.queueId = data.targetQueueId as any;
    ticket.status = TicketStatus.WAITING;
    ticket.counterId = undefined;
    await ticket.save();

    // Enqueue in new queue
    await this.redisService.enqueue(
      data.tenantId,
      data.branchId,
      data.targetQueueId,
      ticket._id.toString(),
    );

    // Clear counter state
    await this.redisService.setCounterState(
      data.tenantId,
      data.branchId,
      data.counterId,
      {
        currentTicketId: '',
        status: 'IDLE',
      },
    );

    this.logger.log(
      `Ticket ${ticket.displayNumber} transferred to queue ${targetQueue.name}`,
    );
    return { ticket, action: 'transferred', targetQueue: targetQueue.name };
  }

  // ======== STATE MACHINE ========

  /**
   * Transition ticket to a new status with validation
   */
  private async transitionTicket(
    ticketId: string,
    newStatus: TicketStatus,
    extraUpdates?: Record<string, any>,
  ): Promise<TicketDocument> {
    const ticket = await this.ticketModel.findById(ticketId).exec();
    if (!ticket) {
      throw new RpcException(new NotFoundException('Ticket not found'));
    }

    if (!isValidTransition(ticket.status as TicketStatus, newStatus)) {
      throw new RpcException(
        new BadRequestException(
          `Invalid transition from ${ticket.status} to ${newStatus}`,
        ),
      );
    }

    ticket.status = newStatus;
    if (extraUpdates) {
      Object.assign(ticket, extraUpdates);
    }
    await ticket.save();

    // Update Redis metadata
    await this.redisService.setTicketMeta(ticketId, {
      status: newStatus,
      ...(extraUpdates?.counterId ? { counterId: extraUpdates.counterId } : {}),
    });

    return ticket;
  }
}
