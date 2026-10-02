import type { Redis } from 'ioredis';

type SetOptions = { expiration?: { type: 'EX' | 'PX'; value: number } };

/**
 * connect-redis v10 ждёт клиент в стиле node-redis (set с объектом опций,
 * mGet, scanIterator), а в проекте ioredis — этот адаптер их сводит.
 */
export function createSessionStoreClient(redis: Redis) {
	return {
		get: (key: string) => redis.get(key),
		set: (key: string, value: string, options?: SetOptions) => {
			const expiration = options?.expiration;
			if (!expiration) {
				return redis.set(key, value);
			}
			return expiration.type === 'PX'
				? redis.set(key, value, 'PX', expiration.value)
				: redis.set(key, value, 'EX', expiration.value);
		},
		expire: (key: string, seconds: number) => redis.expire(key, seconds),
		del: (keys: string | string[]) => redis.del(...[keys].flat()),
		mGet: (keys: string[]) => redis.mget(keys),
		scanIterator: (options: { MATCH: string; COUNT: number }) =>
			redis.scanStream({ match: options.MATCH, count: options.COUNT }) as AsyncIterable<string[]>,
	};
}
