import { Controller, Post, Body, Inject, Headers } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, AUTH_PATTERNS } from '@repo/shared';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return firstValueFrom(this.accountsClient.send(AUTH_PATTERNS.LOGIN, body));
  }

  @Public()
  @Post('register')
  async register(@Body() body: any) {
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.REGISTER, body),
    );
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.REFRESH, body),
    );
  }

  // ─── OTP Authentication ───

  @Public()
  @Post('request-otp')
  async requestOtp(@Body() body: { phone: string }) {
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.REQUEST_OTP, body),
    );
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone: string; code: string }) {
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.VERIFY_OTP, body),
    );
  }

  @Public()
  @Post('login-otp')
  async loginWithOtp(@Body() body: { phone: string; code: string }) {
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.LOGIN_WITH_OTP, body),
    );
  }

  @Public()
  @Post('select-workspace')
  async selectWorkspace(
    @Body() body: { workspaceId: string },
    @Headers('authorization') auth: string,
  ) {
    const sessionToken = auth?.replace('Bearer ', '') || '';
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.SELECT_WORKSPACE, {
        ...body,
        sessionToken,
      }),
    );
  }

  @Public()
  @Post('select-role')
  async selectRole(
    @Body() body: { role: string; workspaceId: string },
    @Headers('authorization') auth: string,
  ) {
    const sessionToken = auth?.replace('Bearer ', '') || '';
    return firstValueFrom(
      this.accountsClient.send(AUTH_PATTERNS.SELECT_ROLE, {
        ...body,
        sessionToken,
      }),
    );
  }
}
