import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';
import { REDIS_KEYS } from '@repo/shared';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redlock: Redlock;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    this.redlock = new Redlock([this.redis], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  // ======== QUEUE OPERATIONS ========

  /** Push ticket ID to the end of a FIFO queue */
  async enqueue(
    tenantId: string,
    branchId: string,
    queueId: string,
    ticketId: string,
  ): Promise<number> {
    const key = REDIS_KEYS.queue(tenantId, branchId, queueId);
    return this.redis.lpush(key, ticketId);
  }

  /** Pop next ticket from the front of a FIFO queue */
  async dequeue(
    tenantId: string,
    branchId: string,
    queueId: string,
  ): Promise<string | null> {
    const key = REDIS_KEYS.queue(tenantId, branchId, queueId);
    return this.redis.rpop(key);
  }

  /** Get current queue length */
  async getQueueLength(
    tenantId: string,
    branchId: string,
    queueId: string,
  ): Promise<number> {
    const key = REDIS_KEYS.queue(tenantId, branchId, queueId);
    return this.redis.llen(key);
  }

  /** Get position of a ticket in queue (0-based) */
  async getTicketPosition(
    tenantId: string,
    branchId: string,
    queueId: string,
    ticketId: string,
  ): Promise<number> {
    const key = REDIS_KEYS.queue(tenantId, branchId, queueId);
    const list = await this.redis.lrange(key, 0, -1);
    // Queue is LIFO in Redis (lpush/rpop), so reverse to get FIFO order
    const reversed = list.reverse();
    const index = reversed.indexOf(ticketId);
    return index;
  }

  /** Remove a specific ticket from queue (e.g., when skipping) */
  async removeFromQueue(
    tenantId: string,
    branchId: string,
    queueId: string,
    ticketId: string,
  ): Promise<number> {
    const key = REDIS_KEYS.queue(tenantId, branchId, queueId);
    return this.redis.lrem(key, 0, ticketId);
  }

  /** Get all ticket IDs in queue */
  async getQueueTickets(
    tenantId: string,
    branchId: string,
    queueId: string,
  ): Promise<string[]> {
    const key = REDIS_KEYS.queue(tenantId, branchId, queueId);
    const list = await this.redis.lrange(key, 0, -1);
    return list.reverse(); // Return in FIFO order
  }

  // ======== PRIORITY QUEUE OPERATIONS ========

  /** Add ticket to priority queue (lower score = higher priority) */
  async enqueuePriority(
    tenantId: string,
    branchId: string,
    queueId: string,
    ticketId: string,
    score: number,
  ): Promise<number> {
    const key = REDIS_KEYS.priorityQueue(tenantId, branchId, queueId);
    return this.redis.zadd(key, score, ticketId);
  }

  /** Pop highest priority ticket */
  async dequeuePriority(
    tenantId: string,
    branchId: string,
    queueId: string,
  ): Promise<string | null> {
    const key = REDIS_KEYS.priorityQueue(tenantId, branchId, queueId);
    const result = await this.redis.zpopmin(key);
    return result && result.length > 0 ? result[0] : null;
  }

  // ======== TICKET COUNTER (auto-increment daily numbers) ========

  /** Increment and get next ticket number for a queue today */
  async getNextTicketNumber(
    tenantId: string,
    branchId: string,
    queueId: string,
  ): Promise<number> {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = REDIS_KEYS.ticketCounter(tenantId, branchId, queueId, date);
    const num = await this.redis.incr(key);
    // Set TTL of 48 hours on first creation
    if (num === 1) {
      await this.redis.expire(key, 48 * 60 * 60);
    }
    return num;
  }

  // ======== TICKET METADATA ========

  /** Store ticket metadata in Redis hash for fast access */
  async setTicketMeta(
    ticketId: string,
    meta: Record<string, string>,
  ): Promise<void> {
    const key = REDIS_KEYS.ticketMeta(ticketId);
    await this.redis.hmset(key, meta);
    await this.redis.expire(key, 24 * 60 * 60); // 24h TTL
  }

  /** Get ticket metadata */
  async getTicketMeta(ticketId: string): Promise<Record<string, string>> {
    const key = REDIS_KEYS.ticketMeta(ticketId);
    return this.redis.hgetall(key);
  }

  /** Delete ticket metadata */
  async deleteTicketMeta(ticketId: string): Promise<void> {
    const key = REDIS_KEYS.ticketMeta(ticketId);
    await this.redis.del(key);
  }

  // ======== COUNTER STATE ========

  /** Set counter's current state */
  async setCounterState(
    tenantId: string,
    branchId: string,
    counterId: string,
    state: Record<string, string>,
  ): Promise<void> {
    const key = REDIS_KEYS.counter(tenantId, branchId, counterId);
    await this.redis.hmset(key, state);
  }

  /** Get counter state */
  async getCounterState(
    tenantId: string,
    branchId: string,
    counterId: string,
  ): Promise<Record<string, string>> {
    const key = REDIS_KEYS.counter(tenantId, branchId, counterId);
    return this.redis.hgetall(key);
  }

  // ======== STATS ========

  /** Update rolling average service time */
  async updateServiceStats(
    tenantId: string,
    branchId: string,
    queueId: string,
    serviceTimeMs: number,
  ): Promise<void> {
    const key = REDIS_KEYS.queueStats(tenantId, branchId, queueId);
    const stats = await this.redis.hgetall(key);
    const totalTime = parseInt(stats.totalServiceTime || '0') + serviceTimeMs;
    const totalCount = parseInt(stats.totalServed || '0') + 1;
    const avgTime = Math.round(totalTime / totalCount);

    await this.redis.hmset(key, {
      totalServiceTime: totalTime.toString(),
      totalServed: totalCount.toString(),
      avgServiceTime: avgTime.toString(),
    });
  }

  /** Get estimated wait time in milliseconds */
  async getEstimatedWaitTime(
    tenantId: string,
    branchId: string,
    queueId: string,
    position: number,
  ): Promise<number> {
    const statsKey = REDIS_KEYS.queueStats(tenantId, branchId, queueId);
    const stats = await this.redis.hgetall(statsKey);
    const avgServiceTime = parseInt(stats.avgServiceTime || '300000'); // Default 5 min
    const activeCountersKey = REDIS_KEYS.activeCounters(
      tenantId,
      branchId,
      queueId,
    );
    const activeCounters = parseInt(
      (await this.redis.get(activeCountersKey)) || '1',
    );
    return Math.round((position * avgServiceTime) / activeCounters);
  }

  // ======== DISTRIBUTED LOCKING ========

  /** Acquire a lock for atomic operations */
  async acquireLock(resource: string, ttl: number = 5000) {
    try {
      return await this.redlock.acquire([`lock:${resource}`], ttl);
    } catch (error) {
      this.logger.error(`Failed to acquire lock for ${resource}`, error);
      throw error;
    }
  }

  // ======== PUB/SUB ========

  /** Publish event to a channel */
  async publish(channel: string, message: any): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(message));
  }

  // ======== GENERIC ========

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
