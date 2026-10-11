import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { createSessionMiddleware } from "@/core/auth/session.middleware";
import { RedisService } from "@/core/redis/redis.service";

export const SESSION_MIDDLEWARE = "SESSION_MIDDLEWARE";

/**
 * Экземпляр middleware ровно один: его берёт и setup-app для HTTP,
 * и шлюз для рукопожатия websocket. Два разных express-session над одним
 * хранилищем работали бы, но «та же сессия» перестало бы быть гарантией.
 */
@Global()
@Module({
  providers: [
    {
      provide: SESSION_MIDDLEWARE,
      inject: [ConfigService, RedisService],
      useFactory: createSessionMiddleware,
    },
  ],
  exports: [SESSION_MIDDLEWARE],
})
export class SessionModule {}
