import { Test, TestingModule } from '@nestjs/testing';
import { ValkeyService } from './valkey.service';
import { ConfigService } from '@nestjs/config';

describe('ValkeyService', () => {
  let service: ValkeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValkeyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'VALKEY_HOST') return '127.0.0.1';
              if (key === 'VALKEY_PORT') return 6379;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ValkeyService>(ValkeyService);
    service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should store and retrieve values in memory fallback when client is disconnected', async () => {
    const testKey = 'test:key:123';
    const testData = { id: 1, name: 'Cache Item' };

    await service.set(testKey, testData, 60);
    const retrieved = await service.get(testKey);

    expect(retrieved).toEqual(testData);

    await service.del(testKey);
    const afterDel = await service.get(testKey);
    expect(afterDel).toBeNull();
  });

  it('should resolve through remember() callback on cache miss', async () => {
    const testKey = 'remember:key:456';
    const computeFn = jest.fn().mockResolvedValue({ computed: true });

    const firstCall = await service.remember(testKey, 60, computeFn);
    expect(firstCall).toEqual({ computed: true });
    expect(computeFn).toHaveBeenCalledTimes(1);

    const secondCall = await service.remember(testKey, 60, computeFn);
    expect(secondCall).toEqual({ computed: true });
    expect(computeFn).toHaveBeenCalledTimes(1); // Cached, not called again
  });
});
