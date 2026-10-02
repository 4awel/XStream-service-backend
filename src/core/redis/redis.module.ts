import { Global, Module } from '@nestjs/common';

import { RedisService } from '@/core/redis/redis.service';

@Global()
@Module({
	providers: [
		RedisService,
	],
	exports: [
		RedisService,
	],
})
export class RedisModule {}
