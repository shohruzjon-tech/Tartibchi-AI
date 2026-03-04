import { Injectable, Logger } from '@nestjs/common';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

/**
 * In-memory OTP storage with automatic expiry.
 *
 * NOTE: This works for single-instance deployments.
 * For production with multiple replicas, replace with Redis-backed storage.
 */
@Injectable()
export class OtpStore {
  private readonly logger = new Logger(OtpStore.name);
  private store = new Map<string, OtpEntry>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly TTL_MS = 2 * 60 * 1000; // 2 minutes

  /**
   * Generate and store a 6-digit OTP for the given phone number.
   * Any existing OTP for that phone is overwritten.
   */
  generate(phone: string): string {
    const code = String(Math.floor(100000 + Math.random() * 900000));

    this.store.set(phone, {
      code,
      expiresAt: Date.now() + this.TTL_MS,
      attempts: 0,
    });

    // Auto-cleanup after TTL
    setTimeout(() => {
      if (this.store.get(phone)?.code === code) {
        this.store.delete(phone);
      }
    }, this.TTL_MS + 1000);

    // In development, log the OTP to console for testing
    this.logger.log(`[DEV] OTP for ${phone}: ${code}`);

    return code;
  }

  /**
   * Verify the OTP code for a phone number.
   * Returns true and removes the entry on success.
   * Returns false on wrong code, expired, or max attempts exceeded.
   */
  verify(phone: string, code: string): boolean {
    const entry = this.store.get(phone);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(phone);
      return false;
    }

    entry.attempts++;
    if (entry.attempts > this.MAX_ATTEMPTS) {
      this.store.delete(phone);
      return false;
    }

    if (entry.code !== code) return false;

    // Valid — consume the OTP
    this.store.delete(phone);
    return true;
  }
}
