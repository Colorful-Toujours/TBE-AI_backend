import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PublicUser, StoredUser } from './types/auth-user.type';

/**
 * AuthService 负责注册、登录以及密码处理。
 *
 * 说明：
 * 1. 当前实现使用内存数组保存用户，服务重启后数据会丢失。
 * 2. 正式项目应替换为数据库，例如 MySQL/PostgreSQL/MongoDB。
 * 3. 当前登录返回的是一个示例 token，正式项目建议改成 JWT 或服务端 session。
 */
@Injectable()
export class AuthService {
  /**
   * 用内存模拟用户表。
   *
   * private readonly 的含义：
   * - private：只允许 AuthService 内部访问，避免其他模块直接修改用户数据。
   * - readonly：不能把 users 重新赋值为另一个数组，但仍可以 push 新用户。
   */
  private readonly users: StoredUser[] = [];

  /** 简单递增 ID，模拟数据库自增主键。 */
  private nextUserId = 1;

  /**
   * 注册新用户。
   *
   * @param dto 注册请求体，包含 username 和 password。
   * @returns 注册成功后的用户信息，不包含密码哈希和盐。
   */
  register(dto: RegisterDto): PublicUser {
    const normalizedUsername = this.normalizeUsername(dto.username);

    // 用户名唯一性检查；真实项目中应该使用数据库唯一索引兜底。
    const existedUser = this.findByUsername(normalizedUsername);
    if (existedUser) {
      throw new ConflictException('用户名已存在');
    }

    // 每个用户生成不同的盐，即使两个用户密码相同，哈希结果也不一样。
    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(dto.password, passwordSalt);

    const user: StoredUser = {
      id: this.nextUserId,
      username: normalizedUsername,
      passwordSalt,
      passwordHash,
      createdAt: new Date(),
    };

    this.users.push(user);
    this.nextUserId += 1;

    return this.toPublicUser(user);
  }

  /**
   * 登录用户。
   *
   * @param dto 登录请求体，包含 username 和 password。
   * @returns 用户信息和登录 token。
   */
  login(dto: LoginDto): { user: PublicUser; token: string } {
    const normalizedUsername = this.normalizeUsername(dto.username);

    const user = this.findByUsername(normalizedUsername);
    if (!user) {
      // 不明确提示“用户不存在”还是“密码错误”，可以减少账号枚举风险。
      throw new UnauthorizedException('用户名或密码错误');
    }

    const inputPasswordHash = this.hashPassword(
      dto.password,
      user.passwordSalt,
    );
    if (inputPasswordHash !== user.passwordHash) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return {
      user: this.toPublicUser(user),
      token: this.createDemoToken(user),
    };
  }

  /**
   * 标准化用户名。
   *
   * 当前只做 trim，保留大小写；如果你的业务希望用户名大小写不敏感，
   * 可以在这里追加 .toLowerCase()。
   */
  private normalizeUsername(username: string): string {
    return typeof username === 'string' ? username.trim() : '';
  }

  /** 根据用户名查询用户；接入数据库后可以替换为 repository.findOne。 */
  private findByUsername(username: string): StoredUser | undefined {
    return this.users.find((user) => user.username === username);
  }

  /**
   * 密码哈希。
   *
   * 当前使用 sha256(password + salt) 演示“不要保存明文密码”的核心思路。
   * 正式生产环境建议使用 bcrypt/argon2 这类专门的密码哈希算法。
   */
  private hashPassword(password: string, salt: string): string {
    return createHash('sha256').update(`${password}.${salt}`).digest('hex');
  }

  /**
   * 创建演示 token。
   *
   * 这个 token 只是为了让前端能完成“登录后拿到凭证”的流程联调，
   * 不能当作正式鉴权方案。后续建议替换为 @nestjs/jwt 生成的 JWT。
   */
  private createDemoToken(user: StoredUser): string {
    const rawToken = `${user.id}.${user.username}.${Date.now()}`;

    return Buffer.from(rawToken).toString('base64url');
  }

  /** 把内部用户结构转换成对外安全返回的用户结构。 */
  private toPublicUser(user: StoredUser): PublicUser {
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
