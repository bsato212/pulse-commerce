import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ValkeyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ValkeyService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private readonly inMemoryFallback = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('VALKEY_HOST', 'localhost');
    const port = this.configService.get<number>('VALKEY_PORT', 6379);
    const password = this.configService.get<string>('VALKEY_PASSWORD');

    try {
      this.client = new Redis({
        host,
        port: Number(port),
        password: password || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`Successfully connected to Valkey instance at ${host}:${port}`);
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Valkey connection error (${err.message}). Using local cache fallback.`);
      });

      this.client.connect().catch((err) => {
        this.logger.warn(
          `Initial Valkey connection failed: ${err.message}. Operating with in-memory cache.`,
        );
      });
    } catch (err: any) {
      this.logger.warn(`Failed to initialize Valkey client: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isConnected && this.client) {
        const raw = await this.client.get(key);
        return raw ? JSON.parse(raw) : null;
      }
    } catch (err: any) {
      this.logger.warn(`Valkey GET error for key ${key}: ${err.message}`);
    }

    // In-memory fallback
    const entry = this.inMemoryFallback.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const serialized = JSON.stringify(value);
    try {
      if (this.isConnected && this.client) {
        if (ttlSeconds > 0) {
          await this.client.setex(key, ttlSeconds, serialized);
        } else {
          await this.client.set(key, serialized);
        }
        return;
      }
    } catch (err: any) {
      this.logger.warn(`Valkey SET error for key ${key}: ${err.message}`);
    }

    this.inMemoryFallback.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      }
    } catch (err: any) {
      this.logger.warn(`Valkey DEL error for key ${key}: ${err.message}`);
    }
    this.inMemoryFallback.delete(key);
  }

  async remember<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  async flushAll(): Promise<void> {
    if (this.isConnected && this.client) {
      await this.client.flushdb().catch(() => {});
    }
    this.inMemoryFallback.clear();
  }
}
