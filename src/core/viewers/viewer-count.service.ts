import { Injectable, OnModuleInit } from "@nestjs/common";

import { RedisService } from "@/core/redis/redis.service";

const KEY = "live:viewers";

/**
 * Сколько зрителей сейчас на каждом канале. Пишет websocket-шлюз (размер комнаты),
 * читают REST-ручки каталога и рекомендаций — им сокеты недоступны.
 *
 * Один hash вместо ключа на канал: HMGET по сотне каналов — один запрос.
 */
@Injectable()
export class ViewerCountService implements OnModuleInit {
  constructor(private readonly redis: RedisService) {}

  /**
   * После рестарта процесса все сокеты переподключатся заново, а старые цифры
   * остались бы висеть. При одном экземпляре API чистим на старте; при
   * нескольких репликах это нужно заменить на счётчики с TTL по каждой реплике.
   */
  async onModuleInit(): Promise<void> {
    await this.redis.del(KEY);
  }

  async set(channelId: string, count: number): Promise<void> {
    if (count > 0) {
      await this.redis.hset(KEY, channelId, count);
    } else {
      await this.redis.hdel(KEY, channelId);
    }
  }

  async get(channelId: string): Promise<number> {
    return Number((await this.redis.hget(KEY, channelId)) ?? 0);
  }

  /** Зрители по списку каналов; отсутствующие — 0. */
  async getMany(channelIds: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    if (channelIds.length === 0) {
      return result;
    }

    const values = await this.redis.hmget(KEY, ...channelIds);
    channelIds.forEach((id, index) => result.set(id, Number(values[index] ?? 0)));
    return result;
  }
}
