import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '13800001001', description: '手机号' })
  @IsString()
  @Length(3, 50)
  username: string;

  @ApiProperty({ enum: ['phone', 'password'], example: 'password' })
  @IsIn(['phone', 'password'])
  loginType: 'phone' | 'password';

  @ApiPropertyOptional({ example: 'demo123', description: 'loginType=password 时必填' })
  @IsOptional()
  @IsString()
  @Length(6, 64)
  password?: string;

  @ApiPropertyOptional({ example: '123456', description: 'loginType=phone 时必填（开发环境）' })
  @IsOptional()
  @IsString()
  @Length(4, 8)
  verificationCode?: string;
}

export class RegisterDto {
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  username: string;

  @IsIn(['register'])
  loginType: 'register';

  @IsString()
  @Length(6, 64)
  password: string;

  @IsOptional()
  @IsString()
  verificationCode?: string;
}

export class SendSmsDto {
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsIn(['login', 'register', 'reset_password'])
  scene: 'login' | 'register' | 'reset_password';
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @Matches(/^1\d{10}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  avatar?: string | null;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @Length(6, 64)
  newPassword: string;
}
