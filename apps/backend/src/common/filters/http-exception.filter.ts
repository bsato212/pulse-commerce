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

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || (exceptionResponse as any).error
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

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
