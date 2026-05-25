import type { UserRole } from '../../common/types/rbac.types';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  name: string;
  jti: string;
}

export interface AuthUserResponse {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string | null;
  role?: UserRole;
  permissions?: string[];
}

export interface AuthTokenResponse {
  token: string;
  user: AuthUserResponse;
}
