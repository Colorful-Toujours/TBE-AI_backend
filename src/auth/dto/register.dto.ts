import { IsString, Length } from 'class-validator';

/**
 * 注册接口的请求体结构。
 *
 * 当前示例只要求 username 和 password；如果业务需要手机号、邮箱、验证码等字段，
 * 可以在这里继续增加字段，并使用 class-validator 装饰器补充校验规则。
 */
export class RegisterDto {
  /** 用户名：当前示例要求全局唯一。 */
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 20, { message: '用户名长度必须在 3 到 20 位之间' })
  username: string;

  /** 明文密码：注册时传入，服务端会加盐哈希后保存。 */
  @IsString({ message: '密码必须是字符串' })
  @Length(6, 32, { message: '密码长度必须在 6 到 32 位之间' })
  password: string;
}
