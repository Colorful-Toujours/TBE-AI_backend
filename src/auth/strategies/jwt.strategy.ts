import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';
import { toStoredUser } from '../../common/mappers/entity.mapper';
import { getPermissionsForRole } from '../../common/types/rbac.types';
import type { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaClient) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'tbe-ai-ledger-dev-secret',
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<JwtPayload & { permissions: string[] }> {
    if (payload.jti) {
      const revoked = await this.prisma.tokenBlacklist.findUnique({
        where: { jti: payload.jti },
      });
      if (revoked) {
        throw new UnauthorizedException('登录已失效');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status === '禁用') {
      throw new UnauthorizedException('用户不存在或已禁用');
    }

    const stored = toStoredUser(user);
    return {
      ...payload,
      role: stored.role,
      name: stored.name,
      permissions: getPermissionsForRole(stored.role),
    };
  }
}
