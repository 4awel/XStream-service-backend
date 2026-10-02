import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisStore } from "connect-redis";
import cookieParser from "cookie-parser";
import type { Express } from "express";
import session from "express-session";

import { DomainExceptionFilter } from "@/core/filtres/domain-exception.filter";
import { createSessionStoreClient } from "@/core/redis/redis-session-client";
import { RedisService } from "@/core/redis/redis.service";
import { isDev } from "@/shared/utils/is-dev.util";
import { ms, type StringValue } from "@/shared/utils/ms.util";
import { parseBoolean } from "@/shared/utils/parse-boolean.util";

type SameSite = "lax" | "strict" | "none";

const SAME_SITE_VALUES: SameSite[] = ["lax", "strict", "none"];

/**
 * В проде фронт и API стоят на разных доменах, значит cookie обязана быть
 * SameSite=None + Secure, иначе браузер её просто не отправит.
 * В dev оба на localhost — хватает lax.
 */
const readSameSite = (config: ConfigService): SameSite => {
  const value = config.get<string>("SESSION_SAME_SITE", "lax");

  if (!SAME_SITE_VALUES.includes(value as SameSite)) {
    throw new Error(
      `SESSION_SAME_SITE must be one of: ${SAME_SITE_VALUES.join(", ")}`,
    );
  }

  return value as SameSite;
};

/**
 * Вся обвязка приложения (cookie, валидация, сессии, фильтры, CORS) в одном месте:
 * её зовёт и main.ts, и e2e-тесты — иначе тесты проверяли бы не то приложение,
 * которое реально уходит в прод.
 */
export function setupApp(app: INestApplication): INestApplication {
  const config = app.get(ConfigService);
  const redis = app.get(RedisService);
  const isSecureCookie = parseBoolean(
    config.getOrThrow<string>("SESSION_SECURE"),
  );

  // За reverse proxy Express видит http и отказывается ставить Secure-cookie,
  // пока не научится доверять X-Forwarded-Proto.
  if (isSecureCookie) {
    (app.getHttpAdapter().getInstance() as Express).set("trust proxy", 1);
  }

  app.use(cookieParser(config.getOrThrow<string>("COOKIE_SECRET")));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(
    session({
      secret: config.getOrThrow<string>("SESSION_SECRET"),
      name: config.getOrThrow<string>("SESSION_NAME"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain: config.getOrThrow<string>("SESSION_DOMAIN"),
        maxAge: ms(config.getOrThrow<StringValue>("SESSION_MAX_AGE")),
        httpOnly: parseBoolean(config.getOrThrow<string>("SESSION_HTTP_ONLY")),
        secure: isSecureCookie,
        sameSite: readSameSite(config),
      },
      store: new RedisStore({
        client: createSessionStoreClient(redis),
        prefix: config.getOrThrow<string>("SESSION_PREFIX"),
      }),
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());

  app.enableCors({
    // Список через запятую: в проде обычно и example.com, и www.example.com.
    origin: config
      .getOrThrow<string>("ALLOWED_ORIGINS")
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    credentials: true,
    // Было exportedHeaders — такого поля у CorsOptions нет, его тихо игнорировали.
    exposedHeaders: ["Set-Cookie"],
  });

  if (isDev(config)) {
    app.enableShutdownHooks();
  }

  return app;
}
