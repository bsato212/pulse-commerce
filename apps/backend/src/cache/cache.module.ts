import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ValkeyService } from './valkey.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ValkeyService],
  exports: [ValkeyService],
})
export class CacheModule {}
