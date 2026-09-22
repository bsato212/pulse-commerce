import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
        genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
        customProps: (req) => ({
          requestId: req.headers['x-request-id'] || req.id,
          tenantId: req.headers['x-tenant-id'] || 'system',
        }),
        transport:
          process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                },
              }
            : undefined,
        serializers: {
          req(req) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              headers: {
                host: req.headers.host,
                'user-agent': req.headers['user-agent'],
                'x-request-id': req.headers['x-request-id'],
              },
            };
          },
        },
      },
    }),
  ],
})
export class CustomLoggerModule {}
