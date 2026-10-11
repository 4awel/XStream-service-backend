import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import type { Express, RequestHandler } from "express";

import { sessionCookieOptions } from "@/core/auth/session-cookie";
import { SESSION_MIDDLEWARE } from "@/core/auth/session.module";
import { DomainExceptionFilter } from "@/core/filtres/domain-exception.filter";
import { isDev } from "@/shared/utils/is-dev.util";

export function setupApp(app: INestApplication): INestApplication {
  const config = app.get(ConfigService);
  const cookieOptions = sessionCookieOptions(config);

  if (cookieOptions.secure) {
    const hops = Number(config.get<string>("TRUST_PROXY_HOPS") ?? 1);
    (app.getHttpAdapter().getInstance() as Express).set(
      "trust proxy",
      Number.isInteger(hops) && hops > 0 ? hops : 1,
    );
  }

  app.use(cookieParser(config.getOrThrow<string>("COOKIE_SECRET")));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(app.get<RequestHandler>(SESSION_MIDDLEWARE));

  app.useGlobalFilters(new DomainExceptionFilter());

  app.enableCors({
    origin: config
      .getOrThrow<string>("ALLOWED_ORIGINS")
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
  });

  if (isDev(config)) {
    app.enableShutdownHooks();
  }

  return app;
}
