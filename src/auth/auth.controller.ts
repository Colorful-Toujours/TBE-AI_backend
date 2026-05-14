import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { PublicUser } from './types/auth-user.type';

/**
 * 认证接口控制器。
 *
 * @Controller('auth') 表示当前控制器下所有接口都会带上 /auth 前缀。
 * 例如 register 方法上的 @Post('register') 最终路径就是 POST /auth/register。
 */
@Controller('auth')
export class AuthController {
  /**
   * Nest 会通过依赖注入把 AuthService 实例传进来。
   * 控制器只负责接收 HTTP 请求，具体业务逻辑放在 service 中，职责更清晰。
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * 注册接口。
   *
   * 请求示例：
   * POST /auth/register
   * {
   *   "username": "test_user",
   *   "password": "123456"
   * }
   */
  @Post('register')
  register(@Body() registerDto: RegisterDto): PublicUser {
    return this.authService.register(registerDto);
  }

  /**
   * 登录接口。
   *
   * 请求示例：
   * POST /auth/login
   * {
   *   "username": "test_user",
   *   "password": "123456"
   * }
   */
  @Post('login')
  login(@Body() loginDto: LoginDto): { user: PublicUser; token: string } {
    return this.authService.login(loginDto);
  }
}
