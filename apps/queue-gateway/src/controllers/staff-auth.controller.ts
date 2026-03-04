import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, AUTH_PATTERNS } from '@repo/shared';
import { Public } from '../decorators/public.decorator';

@Controller('staff/auth')
export class StaffAuthController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() body: { login: string; passcode: string }) {
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.STAFF_LOGIN, body),
    );
  }

  @Public()
  @Post('select-counter')
  async selectCounter(
    @Body() body: { selectionToken: string; counterId: string },
  ) {
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.STAFF_SELECT_COUNTER, body),
    );
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.STAFF_REFRESH, body),
    );
  }
}
