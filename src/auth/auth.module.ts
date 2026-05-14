import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * 认证模块。
 *
 * Nest 推荐按业务能力拆模块。这里把注册、登录相关的 controller/service
 * 都收在 AuthModule 里，后续要接数据库、JWT、验证码时也更容易维护。
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
