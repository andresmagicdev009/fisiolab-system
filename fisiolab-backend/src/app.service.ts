import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from './common/redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  async health() {
    const [db, cache] = await Promise.allSettled([
      this.dataSource.query('SELECT 1'),
      this.redis.get('__health__'),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
      services: {
        database: db.status === 'fulfilled' ? 'up' : 'down',
        redis: cache.status === 'fulfilled' ? 'up' : 'down',
      },
    };
  }
}
