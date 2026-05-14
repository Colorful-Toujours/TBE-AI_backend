/**
 * 服务端内部保存的用户结构。
 *
 * 注意：这里保存的是 passwordHash 和 passwordSalt，而不是明文 password。
 * 真实项目中，这些字段通常会放在数据库用户表里。
 */
export interface StoredUser {
  /** 简单递增 ID；接入数据库后通常由数据库生成。 */
  id: number;

  /** 用户名，当前示例中作为唯一登录凭证。 */
  username: string;

  /** 密码盐：每个用户都不同，用来提升哈希安全性。 */
  passwordSalt: string;

  /** 密码哈希：由 password + salt 计算得到，用于登录时比对。 */
  passwordHash: string;

  /** 创建时间，方便接口返回和后续审计。 */
  createdAt: Date;
}

/**
 * 对外返回的用户结构。
 *
 * 不把 passwordHash/passwordSalt 暴露出去，避免敏感信息泄漏。
 */
export interface PublicUser {
  id: number;
  username: string;
  createdAt: Date;
}
