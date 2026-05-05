import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'UPSTASH_REDIS_REST_URL') {
                return process.env.UPSTASH_REDIS_REST_URL;
              }
              if (key === 'UPSTASH_REDIS_REST_TOKEN') {
                return process.env.UPSTASH_REDIS_REST_TOKEN;
              }
              return null;
            },
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should set and get value', async () => {
    await service.set('test:key', { msg: 'hello' }, 300); // Set with TTL of 5 minutes

    const result = await service.get<{ msg: string }>('test:key');

    expect(result).toEqual({ msg: 'hello' });
  });

  it('should delete value', async () => {
    await service.set('test:del', 'bye', 60);

    await service.del('test:del');

    const result = await service.get('test:del');

    expect(result).toBeNull();
  });

  it('should expire value (TTL)', async () => {
    await service.set('test:ttl', 'expire', 1);

    await new Promise((r) => setTimeout(r, 1500));

    const result = await service.get('test:ttl');

    expect(result).toBeNull();
  });
});