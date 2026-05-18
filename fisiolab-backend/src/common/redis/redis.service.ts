import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      url: this.config.getOrThrow<string>('UPSTASH_REDIS_REST_URL'),
      token: this.config.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN'),
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('Conexion a Redis exitosa!');
    } catch (err) {
      this.logger.error('Conexion a Redis fallida', (err as Error).message);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key);
    } catch (err) {
      this.logger.error(`Redis GET ${key} failed`, (err as Error).message);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
      await this.client.set(key, value, { ex: ttlSeconds });
    } catch (err) {
      this.logger.error(`Redis SET ${key} failed`, (err as Error).message);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      await this.client.del(...keys);
    } catch (err) {
      this.logger.error('Redis DEL failed', (err as Error).message);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      let cursor = 0;
      const toDelete: string[] = [];
      do {
        const [next, keys] = await this.client.scan(cursor, { match: pattern, count: 100 });
        toDelete.push(...keys);
        cursor = Number(next);
      } while (cursor !== 0);
      if (toDelete.length) await this.del(...toDelete);
    } catch (err) {
      this.logger.error(`Redis SCAN ${pattern} failed`, (err as Error).message);
    }
  }
}
