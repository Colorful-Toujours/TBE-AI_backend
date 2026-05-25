import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SkipWrap } from '../common/decorators/skip-wrap.decorator';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  SendSmsDto,
  UpdateProfileDto,
} from './dto/login.dto';
import type { JwtPayload } from './types/jwt-payload.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @SkipWrap()
  @HttpCode(200)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @SkipWrap()
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('sms/send')
  sendSms(@Body() dto: SendSmsDto) {
    return this.authService.sendSms(dto);
  }

  @Public()
  @SkipWrap()
  @Get('wechat/callback')
  wechatCallback(@Query('code') code: string, @Query('state') state?: string) {
    return this.authService.wechatCallback(code, state);
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(204)
  logout(@CurrentUser() user: JwtPayload) {
    this.authService.logout(user);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user);
  }

  @ApiBearerAuth('access-token')
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user, dto);
  }

  @ApiBearerAuth('access-token')
  @Patch('password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, dto);
  }
}
