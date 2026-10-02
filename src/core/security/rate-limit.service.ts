import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { RedisService } from '@/core/redis/redis.service';

@Injectable()
export class RateLimitService {
	constructor(private readonly redis: RedisService) {}

	/**
	 * Фиксированное окно на Redis: не более `limit` вызовов за `windowSec`
	 * для ключа `key`. Иначе — 429 с Retry-After.
	 */
	async consume(key: string, limit: number, windowSec: number): Promise<void> {
		const redisKey = `rl:${key}`;
		const count = await this.redis.incr(redisKey);
		if (count === 1) {
			await this.redis.expire(redisKey, windowSec);
		}
		if (count > limit) {
			let ttl = await this.redis.ttl(redisKey);
			if (ttl < 0) {
				// ключ остался без TTL (сбой между incr и expire) — не даём ему жить вечно
				await this.redis.expire(redisKey, windowSec);
				ttl = windowSec;
			}
			throw new HttpException(
				{
					statusCode: HttpStatus.TOO_MANY_REQUESTS,
					message: 'Too many requests, try again later',
					retryAfter: ttl,
				},
				HttpStatus.TOO_MANY_REQUESTS,
			);
		}
	}
}
