import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import type { Express, RequestHandler } from "express";

import { sessionCookieOptions } from "@/core/auth/session-cookie";
import { SESSION_MIDDLEWARE } from "@/core/auth/session.module";
import { DomainExceptionFilter } from "@/core/filtres/domain-exception.filter";
import { isDev } from "@/shared/utils/is-dev.util";

/**
 * Вся обвязка приложения (cookie, валидация, сессии, фильтры, CORS) в одном месте:
 * её зовёт и main.ts, и e2e-тесты — иначе тесты проверяли бы не то приложение,
 * которое реально уходит в прод.
 */
export function setupApp(app: INestApplication): INestApplication {
  const config = app.get(ConfigService);
  const cookieOptions = sessionCookieOptions(config);

  // За reverse proxy Express видит http и отказывается ставить Secure-cookie,
  // пока не научится доверять X-Forwarded-Proto.
  if (cookieOptions.secure) {
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

  // Тот же экземпляр получает и websocket-шлюз — см. session.module.ts.
  app.use(app.get<RequestHandler>(SESSION_MIDDLEWARE));

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
