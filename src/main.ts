import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import "dotenv/config";

import { CoreModule } from "@/core/core.module";
import { setupApp } from "@/setup-app";
import { isDev } from "@/shared/utils/is-dev.util";

async function bootstrap() {
  const app = await NestFactory.create(CoreModule);
  const config = app.get(ConfigService);

  // Swagger описывает в том числе приватные эндпоинты, наружу его не выставляем.
  if (isDev(config)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Stream API")
      .setDescription("Stream backend API")
      .setVersion("1.0")
      .addCookieAuth("session")
      .build();

    SwaggerModule.setup("api", app, () =>
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  setupApp(app);

  // 0.0.0.0, иначе внутри контейнера приложение слушает только localhost
  // и MediaMTX до него не дотянется.
  await app.listen(config.getOrThrow<number>("APPLICATION_PORT"), "0.0.0.0");
}
void bootstrap();
