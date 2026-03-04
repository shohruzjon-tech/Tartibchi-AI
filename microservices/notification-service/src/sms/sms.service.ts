import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Eskiz SMS Service for Uzbekistan
 * API: https://notify.eskiz.uz
 */
@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('ESKIZ_BASE_URL', 'https://notify.eskiz.uz'),
    });
  }

  async onModuleInit() {
    const email = this.configService.get<string>('ESKIZ_EMAIL');
    const password = this.configService.get<string>('ESKIZ_PASSWORD');

    if (email && password) {
      await this.authenticate(email, password);
    } else {
      this.logger.warn('Eskiz SMS credentials not configured. SMS will be disabled.');
    }
  }

  private async authenticate(email: string, password: string): Promise<void> {
    try {
      const response = await this.client.post('/api/auth/login', {
        email,
        password,
      });
      this.token = response.data?.data?.token;
      this.logger.log('Eskiz SMS authenticated successfully');
    } catch (error) {
      this.logger.error('Eskiz SMS authentication failed', error);
    }
  }

  async send(phone: string, message: string): Promise<any> {
    if (!this.token) {
      this.logger.warn('SMS not sent - no auth token. Check Eskiz credentials.');
      return { success: false, reason: 'no_auth_token' };
    }

    try {
      const response = await this.client.post(
        '/api/message/sms/send',
        {
          mobile_phone: phone.replace(/\D/g, ''),
          message,
          from: '4546',
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      // Re-authenticate if token expired
      if (error.response?.status === 401) {
        const email = this.configService.get<string>('ESKIZ_EMAIL');
        const password = this.configService.get<string>('ESKIZ_PASSWORD');
        if (email && password) {
          await this.authenticate(email, password);
          return this.send(phone, message);
        }
      }
      throw error;
    }
  }
}
