import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorCode, ApiFailureResponse } from '../types/api.types';

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
  501: 'NOT_IMPLEMENTED',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = '服务器内部错误';
    let details: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const rawMessage = (exceptionResponse as { message?: string | string[] })
        .message;
      message = Array.isArray(rawMessage)
        ? rawMessage.join('; ')
        : (rawMessage ?? message);
      if ('details' in exceptionResponse) {
        details = (exceptionResponse as { details?: Record<string, unknown> })
          .details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const body: ApiFailureResponse = {
      success: false,
      error: {
        code: STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR',
        message,
        details,
      },
    };

    response.status(status).json(body);
  }
}
