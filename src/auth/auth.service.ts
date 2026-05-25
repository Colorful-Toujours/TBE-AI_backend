import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotImplementedException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../common/services/audit.service';
import { toStoredUser } from '../common/mappers/entity.mapper';
import type { StoredUser } from '../common/storage/entities';
import { getPermissionsForRole } from '../common/types/rbac.types';
import { newId } from '../common/utils/id.util';
import { PasswordUtil } from '../common/utils/password.util';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  SendSmsDto,
  UpdateProfileDto,
} from './dto/login.dto';
import type {
  AuthTokenResponse,
  AuthUserResponse,
  JwtPayload,
} from './types/jwt-payload.type';

const SMS_COOLDOWN_MS = 60_000;
const SMS_EXPIRES_MS = 300_000;
const DEV_SMS_CODE = '123456';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordUtil: PasswordUtil,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const phone = dto.username.trim();
    if (await this.findByPhone(phone)) {
      throw new ConflictException('用户名已存在');
    }

    const passwordFields = this.passwordUtil.createFields(dto.password);
    const created = await this.prisma.user.create({
      data: {
        id: newId('u'),
        name: phone,
        phone,
        role: 'user',
        status: '启用',
        ...passwordFields,
      },
    });
    const user = toStoredUser(created);

    await this.auditService.record({
      action: 'create',
      module: 'auth',
      target: '用户注册',
      detail: `${user.name} 注册成功`,
      operator: user.name,
      operatorId: user.id,
      status: 'success',
    });

    return this.issueToken(user);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const account = dto.username.trim();

    if (dto.loginType === 'phone') {
      return this.loginWithPhone(account, dto.verificationCode);
    }

    return this.loginWithPassword(account, dto.password);
  }

  async sendSms(dto: SendSmsDto) {
    const phone = dto.phone.trim();
    const now = Date.now();
    const latest = await this.prisma.smsCode.findFirst({
      where: { phone },
      orderBy: { sentAt: 'desc' },
    });

    if (latest && now - latest.sentAt.getTime() < SMS_COOLDOWN_MS) {
      throw new HttpException(
        '发送过于频繁，请稍后再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code =
      process.env.NODE_ENV === 'production'
        ? String(Math.floor(100000 + Math.random() * 900000))
        : DEV_SMS_CODE;

    await this.prisma.smsCode.create({
      data: {
        phone,
        code,
        scene: dto.scene,
        expiresAt: new Date(now + SMS_EXPIRES_MS),
        sentAt: new Date(now),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[SMS][${dto.scene}] ${phone} => ${code}`);
    }

    return { expiresIn: 300, cooldown: 60 };
  }

  async logout(user: JwtPayload) {
    await this.prisma.tokenBlacklist.create({
      data: { jti: user.jti },
    });
    await this.auditService.record({
      action: 'logout',
      module: 'auth',
      target: '系统登出',
      operator: user.name,
      operatorId: user.sub,
      status: 'success',
    });
  }

  async getMe(user: JwtPayload) {
    const stored = await this.requireUser(user.sub);
    return {
      ...this.toAuthUser(stored),
      role: stored.role,
      permissions: getPermissionsForRole(stored.role),
    };
  }

  async updateProfile(user: JwtPayload, dto: UpdateProfileDto) {
    const stored = await this.requireUser(user.sub);
    if (dto.phone && dto.phone !== stored.phone) {
      const conflict = await this.findByPhone(dto.phone);
      if (conflict && conflict.id !== stored.id) {
        throw new ConflictException('手机号已被使用');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: stored.id },
      data: {
        phone: dto.phone ?? stored.phone,
        name: dto.name ?? stored.name,
        email: dto.email ?? stored.email,
        avatar: dto.avatar !== undefined ? dto.avatar : stored.avatar,
      },
    });
    const next = toStoredUser(updated);

    await this.auditService.record({
      action: 'update',
      module: 'settings',
      target: '个人资料',
      operator: next.name,
      operatorId: next.id,
      status: 'success',
    });

    return this.toAuthUser(next);
  }

  async changePassword(user: JwtPayload, dto: ChangePasswordDto) {
    const stored = await this.requireUser(user.sub);
    if (!stored.passwordHash || !stored.passwordSalt) {
      throw new ForbiddenException('验证码注册用户尚未设置密码');
    }

    const currentHash = this.passwordUtil.hash(
      dto.currentPassword,
      stored.passwordSalt,
    );
    if (currentHash !== stored.passwordHash) {
      throw new BadRequestException('当前密码错误');
    }

    const next = this.passwordUtil.createFields(dto.newPassword);
    await this.prisma.user.update({
      where: { id: stored.id },
      data: next,
    });

    await this.auditService.record({
      action: 'update',
      module: 'settings',
      target: '修改密码',
      operator: stored.name,
      operatorId: stored.id,
      status: 'success',
    });

    return { ok: true };
  }

  wechatCallback(_code: string, _state?: string): AuthTokenResponse {
    throw new NotImplementedException('微信登录尚未配置');
  }

  private async loginWithPhone(phone: string, code?: string) {
    if (!/^1\d{10}$/.test(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
    if (!code?.trim()) {
      throw new BadRequestException('请输入验证码');
    }

    await this.verifySmsCode(phone, code.trim(), 'login');

    let user = await this.findByPhone(phone);
    if (!user) {
      const created = await this.prisma.user.create({
        data: {
          id: newId('u'),
          name: phone,
          phone,
          role: 'user',
          status: '启用',
        },
      });
      user = toStoredUser(created);
    }

    return this.completeLogin(user, 'phone');
  }

  private async loginWithPassword(account: string, password?: string) {
    if (!password) {
      throw new BadRequestException('请输入密码');
    }

    const row =
      (await this.prisma.user.findUnique({ where: { phone: account } })) ??
      (await this.prisma.user.findFirst({
        where: { email: { equals: account, mode: 'insensitive' } },
      }));

    if (!row?.passwordHash || !row.passwordSalt) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const hash = this.passwordUtil.hash(password, row.passwordSalt);
    if (hash !== row.passwordHash) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return this.completeLogin(toStoredUser(row), 'password');
  }

  private async completeLogin(
    user: StoredUser,
    mode: string,
  ): Promise<AuthTokenResponse> {
    if (user.status === '禁用') {
      throw new ForbiddenException('账号已禁用');
    }

    await this.auditService.record({
      action: 'login',
      module: 'auth',
      target: '系统登录',
      detail: `${user.name} 登录成功（${mode}）`,
      operator: user.name,
      operatorId: user.id,
      status: 'success',
    });

    return this.issueToken(user);
  }

  private async verifySmsCode(phone: string, code: string, scene: string) {
    const now = new Date();
    const record = await this.prisma.smsCode.findFirst({
      where: {
        phone,
        scene,
        expiresAt: { gte: now },
        code,
      },
      orderBy: { sentAt: 'desc' },
    });

    if (!record) {
      throw new UnauthorizedException('验证码无效或已过期');
    }
  }

  private issueToken(user: StoredUser): AuthTokenResponse {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      name: user.name,
      jti: randomUUID(),
    };

    return {
      token: this.jwtService.sign(payload),
      user: this.toAuthUser(user),
    };
  }

  private toAuthUser(user: StoredUser): AuthUserResponse {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar ?? null,
    };
  }

  private async requireUser(id: string): Promise<StoredUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return toStoredUser(user);
  }

  private async findByPhone(phone: string): Promise<StoredUser | undefined> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    return user ? toStoredUser(user) : undefined;
  }
}
