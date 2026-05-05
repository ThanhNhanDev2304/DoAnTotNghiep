import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
    private readonly redisClient: Redis;
    private readonly logger = new Logger(RedisService.name);
    constructor(
        private readonly configService: ConfigService
    ) {
        const url = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
        const token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');
        if (!url || !token) {
            throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in environment variables');
        }
        this.redisClient = new Redis({
            url,
            token,
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redisClient.get<T>(key);
            return value as T | null;
        } catch (error) {
            this.logger.error('[Redis GET ERROR]', { key, error: (error as Error).message});
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        try {
            if (ttlSeconds) {
                await this.redisClient.set(key, value, { ex: ttlSeconds });
            } else {
                await this.redisClient.set(key, value);
            }
        } catch (error) {
            this.logger.error('[Redis SET ERROR]', { key, value, error: (error as Error).message });
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redisClient.del(key);
        } catch (error) {
            this.logger.error('[Redis DEL ERROR]', { key, error: (error as Error).message });
        }
    }

}
