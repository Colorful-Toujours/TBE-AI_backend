import { IsString, Length } from 'class-validator';

/**
 * 登录接口的请求体结构。
 *
 * 使用 class 而不是 interface，是因为 interface 编译成 JavaScript 后会消失；
 * class 会保留到运行时，Nest 的 ValidationPipe 才能读取下面这些装饰器并自动校验。
 */
export class LoginDto {
  /** 用户名：用于定位要登录的用户。 */
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 20, { message: '用户名长度必须在 3 到 20 位之间' })
  username: string;

  /** 明文密码：只在请求中短暂存在，服务端不会保存明文。 */
  @IsString({ message: '密码必须是字符串' })
  @Length(6, 32, { message: '密码长度必须在 6 到 32 位之间' })
  password: string;
}
