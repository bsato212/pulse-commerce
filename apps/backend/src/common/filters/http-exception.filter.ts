import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    let message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || (exceptionResponse as any).error
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    // Intercept PostgreSQL invalid UUID format / type syntax errors (code 22P02)
    const errObj = exception as any;
    if (
      errObj?.code === '22P02' ||
      (typeof message === 'string' && message.includes('invalid input syntax for type uuid'))
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid identifier syntax: expected valid UUID format';
    }

    const errorBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] || null,
      message,
    };

    if (status >= 500) {
      this.logger.error(
        `HTTP 500 on ${request.method} ${request.url}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `HTTP ${status} on ${request.method} ${request.url}: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorBody);
  }
}
