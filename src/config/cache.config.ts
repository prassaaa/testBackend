import { Injectable } from '@nestjs/common';
import { CacheOptionsFactory, CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { ioRedisStore } from '@tirke/node-cache-manager-ioredis';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    return {
      store: ioRedisStore({
        host: this.configService.get<string>('redis.host') || 'localhost',
        port: this.configService.get<number>('redis.port') || 6379,
        password: this.configService.get<string>('redis.password'),
        ttl: (this.configService.get<number>('app.cacheTtl') || 900) * 1000, // Convert to milliseconds
      }),
    };
  }
}
