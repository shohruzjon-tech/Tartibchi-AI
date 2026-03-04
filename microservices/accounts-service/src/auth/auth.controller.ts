import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_PATTERNS } from '@repo/shared';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  async login(@Payload() data: { email: string; password: string }) {
    return this.authService.login(data.email, data.password);
  }

  @MessagePattern(AUTH_PATTERNS.REGISTER)
  async register(@Payload() data: any) {
    return this.authService.register(data);
  }

  @MessagePattern(AUTH_PATTERNS.REFRESH)
  async refresh(@Payload() data: { refreshToken: string }) {
    return this.authService.refreshToken(data.refreshToken);
  }

  @MessagePattern(AUTH_PATTERNS.VALIDATE)
  async validate(@Payload() data: { token: string }) {
    return this.authService.validateToken(data.token);
  }

  @MessagePattern(AUTH_PATTERNS.STAFF_LOGIN)
  async staffLogin(@Payload() data: { login: string; passcode: string }) {
    return this.authService.staffLogin(data.login, data.passcode);
  }

  @MessagePattern(AUTH_PATTERNS.STAFF_SELECT_COUNTER)
  async staffSelectCounter(
    @Payload() data: { selectionToken: string; counterId: string },
  ) {
    return this.authService.staffSelectCounter(
      data.selectionToken,
      data.counterId,
    );
  }

  @MessagePattern(AUTH_PATTERNS.STAFF_REFRESH)
  async staffRefresh(@Payload() data: { refreshToken: string }) {
    return this.authService.refreshStaffToken(data.refreshToken);
  }

  // ─── OTP Authentication ───

  @MessagePattern(AUTH_PATTERNS.REQUEST_OTP)
  async requestOtp(@Payload() data: { phone: string }) {
    return this.authService.requestOtp(data.phone);
  }

  @MessagePattern(AUTH_PATTERNS.VERIFY_OTP)
  async verifyOtp(@Payload() data: { phone: string; code: string }) {
    return this.authService.verifyOtp(data.phone, data.code);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN_WITH_OTP)
  async loginWithOtp(@Payload() data: { phone: string; code: string }) {
    return this.authService.loginWithOtp(data.phone, data.code);
  }

  @MessagePattern(AUTH_PATTERNS.SELECT_WORKSPACE)
  async selectWorkspace(
    @Payload() data: { sessionToken: string; workspaceId: string },
  ) {
    return this.authService.selectWorkspace(
      data.sessionToken,
      data.workspaceId,
    );
  }

  @MessagePattern(AUTH_PATTERNS.SELECT_ROLE)
  async selectRole(
    @Payload()
    data: {
      sessionToken: string;
      role: string;
      workspaceId: string;
    },
  ) {
    return this.authService.selectRole(
      data.sessionToken,
      data.role,
      data.workspaceId,
    );
  }
}
