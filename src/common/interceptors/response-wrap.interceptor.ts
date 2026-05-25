import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { SKIP_WRAP_KEY } from '../decorators/skip-wrap.decorator';
import type { ApiSuccessResponse } from '../types/api.types';

@Injectable()
export class ResponseWrapInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipWrap = this.reflector.getAllAndOverride<boolean>(SKIP_WRAP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipWrap) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (data === undefined || data === null) {
          return data;
        }
        const wrapped: ApiSuccessResponse<unknown> = {
          success: true,
          data,
        };
        return wrapped;
      }),
    );
  }
}
