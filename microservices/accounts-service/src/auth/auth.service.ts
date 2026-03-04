import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { TenantService } from '../tenant/tenant.service';
import { CounterService } from '../counter/counter.service';
import { BranchService } from '../branch/branch.service';
import { OtpStore } from './otp.store';
import { UserRole } from '@repo/shared';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    private readonly counterService: CounterService,
    private readonly branchService: BranchService,
    private readonly otpStore: OtpStore,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new RpcException(new UnauthorizedException('Invalid credentials'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new RpcException(new UnauthorizedException('Invalid credentials'));
    }

    return this.generateTokens(user);
  }

  async register(data: any) {
    // Verify OTP token if provided (proves phone was verified)
    if (data.otpToken) {
      try {
        const payload = this.jwtService.verify(data.otpToken);
        if (payload.type !== 'otp-verified' || payload.phone !== data.phone) {
          throw new Error();
        }
      } catch {
        throw new RpcException(
          new BadRequestException('Phone verification failed'),
        );
      }
    }

    // Only check for duplicate email if email is provided
    if (data.email) {
      const existingUser = await this.userService.findByEmail(data.email);
      if (existingUser) {
        throw new RpcException(
          new ConflictException('Email already registered'),
        );
      }
    }

    const role = data.role || UserRole.TENANT_ADMIN;

    // Prevent duplicate TENANT_ADMIN registration with the same phone
    if (role === UserRole.TENANT_ADMIN && data.phone) {
      const existingByPhone = await this.userService.findByPhone(data.phone);
      const existingAdmin = existingByPhone.find(
        (u) => u.role === UserRole.TENANT_ADMIN,
      );
      if (existingAdmin) {
        throw new RpcException(
          new ConflictException('Phone number already registered'),
        );
      }
    }

    let tenantId = data.tenantId;

    // Auto-create tenant for TENANT_ADMIN registrations
    if (role === UserRole.TENANT_ADMIN && !tenantId) {
      const tenantName = data.tenantName || data.businessName;
      if (!tenantName) {
        throw new RpcException(
          new BadRequestException('Business name is required for registration'),
        );
      }
      const tenant = await this.tenantService.create({ name: tenantName });
      tenantId = tenant._id;
    }

    const userData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role,
      tenantId,
    };

    if (data.email) {
      userData.email = data.email;
    }

    if (data.password) {
      userData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await this.userService.create(userData);

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new RpcException(new UnauthorizedException('User not found'));
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new RpcException(
        new UnauthorizedException('Invalid refresh token'),
      );
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        return null;
      }
      const { password, ...result } = user.toObject();
      return result;
    } catch {
      return null;
    }
  }

  // ─── OTP Authentication ───

  async requestOtp(phone: string) {
    this.otpStore.generate(phone);
    // TODO: send SMS via notification-service (for now, code is logged)
    return { success: true, message: 'OTP sent' };
  }

  async verifyOtp(phone: string, code: string) {
    const valid = this.otpStore.verify(phone, code);
    if (!valid) {
      throw new RpcException(
        new UnauthorizedException('Invalid or expired OTP'),
      );
    }

    // Return a short-lived token proving this phone was verified
    const otpToken = this.jwtService.sign(
      { phone, type: 'otp-verified' },
      { expiresIn: '10m' },
    );
    return { verified: true, otpToken };
  }

  async loginWithOtp(phone: string, code: string) {
    const valid = this.otpStore.verify(phone, code);
    if (!valid) {
      throw new RpcException(
        new UnauthorizedException('Invalid or expired OTP'),
      );
    }

    const users = await this.userService.findByPhone(phone);
    const activeUsers = users.filter((u) => u.isActive);

    if (!activeUsers.length) {
      throw new RpcException(
        new UnauthorizedException('No account found for this phone number'),
      );
    }

    // Group users by tenant (each tenant = one workspace)
    const tenantMap = new Map<string, any[]>();
    for (const user of activeUsers) {
      const tenantId = user.tenantId?.toString() || '';
      if (!tenantMap.has(tenantId)) tenantMap.set(tenantId, []);
      tenantMap.get(tenantId)!.push(user);
    }

    // Single workspace + single role → direct login
    if (tenantMap.size === 1) {
      const [, tenantUsers] = [...tenantMap.entries()][0];
      if (tenantUsers.length === 1) {
        return this.generateTokens(tenantUsers[0]);
      }
    }

    // Multiple workspaces or roles → return workspace list + session token
    const workspaces: Array<{
      id: string;
      name: string;
      branchName?: string;
      branchId?: string;
      tenantId: string;
    }> = [];
    for (const [tenantId, tenantUsers] of tenantMap.entries()) {
      let tenantName = 'Workspace';
      let branchName: string | undefined;
      let branchId: string | undefined;

      try {
        const tenant = await this.tenantService.findById(tenantId);
        if (tenant) tenantName = tenant.name;
      } catch {}

      const userWithBranch = tenantUsers.find((u: any) => u.branchId);
      if (userWithBranch?.branchId) {
        try {
          const branch = await this.branchService.findById(
            userWithBranch.branchId.toString(),
          );
          if (branch) {
            branchName = branch.name;
            branchId = (branch as any)._id.toString();
          }
        } catch {}
      }

      workspaces.push({
        id: tenantId,
        name: tenantName,
        branchName,
        branchId,
        tenantId,
      });
    }

    const sessionToken = this.jwtService.sign(
      { phone, type: 'otp-session' },
      { expiresIn: '5m' },
    );

    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      workspaces,
      sessionToken,
    };
  }

  async selectWorkspace(sessionToken: string, workspaceId: string) {
    let phone: string;
    try {
      const payload = this.jwtService.verify(sessionToken);
      if (payload.type !== 'otp-session') throw new Error();
      phone = payload.phone;
    } catch {
      throw new RpcException(new UnauthorizedException('Session expired'));
    }

    const users = await this.userService.findByPhone(phone);
    const workspaceUsers = users.filter(
      (u) => u.isActive && u.tenantId?.toString() === workspaceId,
    );

    if (!workspaceUsers.length) {
      throw new RpcException(
        new UnauthorizedException('No access to this workspace'),
      );
    }

    // Single role → direct login
    if (workspaceUsers.length === 1) {
      return this.generateTokens(workspaceUsers[0]);
    }

    // Multiple roles → return choices
    const roles = workspaceUsers.map((u) => ({
      role: u.role,
      label: this.getRoleLabel(u.role),
      description: this.getRoleDescription(u.role),
    }));

    const newSessionToken = this.jwtService.sign(
      { phone, tenantId: workspaceId, type: 'otp-session' },
      { expiresIn: '5m' },
    );

    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      roles,
      sessionToken: newSessionToken,
    };
  }

  async selectRole(sessionToken: string, role: string, workspaceId: string) {
    let phone: string;
    try {
      const payload = this.jwtService.verify(sessionToken);
      if (payload.type !== 'otp-session') throw new Error();
      phone = payload.phone;
    } catch {
      throw new RpcException(new UnauthorizedException('Session expired'));
    }

    const users = await this.userService.findByPhone(phone);
    const targetUser = users.find(
      (u) =>
        u.isActive && u.tenantId?.toString() === workspaceId && u.role === role,
    );

    if (!targetUser) {
      throw new RpcException(
        new UnauthorizedException('Invalid role selection'),
      );
    }

    return this.generateTokens(targetUser);
  }

  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.TENANT_ADMIN]: 'Owner / Admin',
      [UserRole.BRANCH_MANAGER]: 'Branch Manager',
      [UserRole.STAFF]: 'Staff',
    };
    return labels[role] || role;
  }

  private getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      [UserRole.SUPER_ADMIN]: 'System administration',
      [UserRole.TENANT_ADMIN]: 'Full access to manage your business',
      [UserRole.BRANCH_MANAGER]: 'Manage branch operations and staff',
      [UserRole.STAFF]: 'Serve customers at your counter',
    };
    return descriptions[role] || '';
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      branchId: user.branchId,
    };

    // Fetch tenant to include mode/onboarding info
    let tenantMode: string | null = null;
    let onboardingCompleted = false;
    let workspaceName: string | undefined;
    if (user.tenantId) {
      try {
        const tenant = await this.tenantService.findById(
          user.tenantId.toString(),
        );
        if (tenant) {
          tenantMode = tenant.mode || null;
          onboardingCompleted = tenant.onboardingCompleted || false;
          workspaceName = tenant.name;
        }
      } catch {}
    }

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION',
          '7d',
        ) as any,
      }),
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        tenantMode,
        onboardingCompleted,
        workspaceName,
      },
    };
  }

  // ─── Staff Authentication ───

  async staffLogin(login: string, passcode: string) {
    const normalizedLogin = login.replace(/[\s\-()]/g, '');

    const counters = await this.counterService.findByLogin(normalizedLogin);
    if (!counters.length) {
      throw new RpcException(new UnauthorizedException('Invalid credentials'));
    }

    const validCounters: any[] = [];
    for (const counter of counters) {
      if (!counter.passcode) continue;
      const match = await bcrypt.compare(passcode, counter.passcode);
      if (match) validCounters.push(counter);
    }

    if (!validCounters.length) {
      throw new RpcException(new UnauthorizedException('Invalid credentials'));
    }

    if (validCounters.length === 1) {
      return this.generateStaffTokens(validCounters[0]);
    }

    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      counters: validCounters.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        counterNumber: c.counterNumber,
        branchName: (c.branchId as any)?.name || '',
        tenantName: (c.tenantId as any)?.name || '',
        tenantId:
          (c.tenantId as any)?._id?.toString() || c.tenantId?.toString(),
        branchId:
          (c.branchId as any)?._id?.toString() || c.branchId?.toString(),
      })),
      selectionToken: this.jwtService.sign(
        { login: normalizedLogin, type: 'staff-selection' },
        { expiresIn: '5m' },
      ),
    };
  }

  async staffSelectCounter(selectionToken: string, counterId: string) {
    try {
      const payload = this.jwtService.verify(selectionToken);
      if (payload.type !== 'staff-selection') {
        throw new RpcException(
          new UnauthorizedException('Invalid selection token'),
        );
      }

      const counter = await this.counterService.findById(counterId);
      if (!counter || counter.login !== payload.login) {
        throw new RpcException(
          new UnauthorizedException('Invalid counter selection'),
        );
      }

      return this.generateStaffTokens(counter);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException(
        new UnauthorizedException('Selection token expired'),
      );
    }
  }

  async refreshStaffToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'staff') {
        throw new RpcException(
          new UnauthorizedException('Invalid refresh token'),
        );
      }

      const counter = await this.counterService.findById(payload.sub);
      if (!counter) {
        throw new RpcException(new UnauthorizedException('Counter not found'));
      }

      return this.generateStaffTokens(counter);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException(
        new UnauthorizedException('Invalid refresh token'),
      );
    }
  }

  private generateStaffTokens(counter: any) {
    const employee = counter.employeeId;
    const tenantId =
      (counter.tenantId as any)?._id?.toString() ||
      counter.tenantId?.toString();
    const branchId =
      (counter.branchId as any)?._id?.toString() ||
      counter.branchId?.toString();

    const payload = {
      sub: counter._id.toString(),
      type: 'staff',
      role: UserRole.STAFF,
      employeeId: employee?._id?.toString() || employee?.toString(),
      tenantId,
      branchId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '12h',
      }),
      user: {
        id: employee?._id?.toString() || employee?.toString(),
        firstName: employee?.firstName || '',
        lastName: employee?.lastName || '',
        email: employee?.email || '',
        phone: counter.login,
        counterId: counter._id.toString(),
        counterName: counter.name,
        counterNumber: counter.counterNumber,
        tenantId,
        branchId,
        role: UserRole.STAFF,
        type: 'staff',
      },
      counters: null,
    };
  }
}
