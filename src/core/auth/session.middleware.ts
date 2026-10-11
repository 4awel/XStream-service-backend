import { ConfigService } from "@nestjs/config";
import { RedisStore } from "connect-redis";
import type { RequestHandler } from "express";
import session from "express-session";

import { sessionCookieOptions } from "@/core/auth/session-cookie";
import { createSessionStoreClient } from "@/core/redis/redis-session-client";
import { RedisService } from "@/core/redis/redis.service";
import { ms, type StringValue } from "@/shared/utils/ms.util";

/**
 * Один и тот же middleware ставит сессию и на HTTP-запросы (setup-app.ts),
 * и на рукопожатие websocket (events.gateway.ts).
 *
 * Иначе шлюзу пришлось бы самому снимать подпись с cookie и лезть в Redis, то
 * есть держать копию настроек сессии — и разъехаться с ними при первом же
 * изменении SESSION_SECRET или SESSION_PREFIX.
 */
export const createSessionMiddleware = (
  config: ConfigService,
  redis: RedisService,
): RequestHandler =>
  session({
    secret: config.getOrThrow<string>("SESSION_SECRET"),
    name: config.getOrThrow<string>("SESSION_NAME"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      ...sessionCookieOptions(config),
      maxAge: ms(config.getOrThrow<StringValue>("SESSION_MAX_AGE")),
    },
    store: new RedisStore({
      client: createSessionStoreClient(redis),
      prefix: config.getOrThrow<string>("SESSION_PREFIX"),
    }),
  });
