import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ResponseWrapInterceptor } from './interceptors/response-wrap.interceptor';
import { AuditService } from './services/audit.service';
import { PasswordUtil } from './utils/password.util';

@Global()
@Module({
  providers: [
    PasswordUtil,
    AuditService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseWrapInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [PasswordUtil, AuditService],
})
export class CommonModule {}
