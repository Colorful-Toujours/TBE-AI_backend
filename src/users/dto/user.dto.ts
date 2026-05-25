import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { UserRole } from '../../common/types/rbac.types';

export class ListUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['super_admin', 'admin', 'employee', 'finance', 'user'])
  role?: UserRole;

  @IsOptional()
  @IsIn(['启用', '禁用'])
  status?: '启用' | '禁用';
}

export class CreateUserDto {
  @IsString()
  @Length(1, 50)
  name: string;

  @Matches(/^1\d{10}$/)
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsIn(['super_admin', 'admin', 'employee', 'finance', 'user'])
  role: UserRole;

  @IsIn(['启用', '禁用'])
  status: '启用' | '禁用';

  @IsOptional()
  @IsString()
  @Length(6, 64)
  password?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(/^1\d{10}$/)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['super_admin', 'admin', 'employee', 'finance', 'user'])
  role?: UserRole;

  @IsOptional()
  @IsIn(['启用', '禁用'])
  status?: '启用' | '禁用';
}

export class UserResponseDto {
  @Type(() => String)
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: '启用' | '禁用';
  createdAt: string;
}
