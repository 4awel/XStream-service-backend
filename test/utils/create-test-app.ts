import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import "dotenv/config";

import { CoreModule } from "@/core/core.module";
import { MailService } from "@/core/mail/mail.service";
import { PrismaService } from "@/core/prisma/prisma.service";
import { RedisService } from "@/core/redis/redis.service";
import { setupApp } from "@/setup-app";


export class FakeMailService {
  /** email -> последний отправленный код */
  readonly sentCodes = new Map<string, string>();

  async sendVerificationCode(to: string, code: string): Promise<void> {
    this.sentCodes.set(to, code);
  }

  async send(): Promise<void> {}

  codeFor(email: string): string {
    const code = this.sentCodes.get(email);
    if (!code) {
      throw new Error(`Письмо с кодом для ${email} не отправлялось`);
    }
    return code;
  }
}

export type TestApp = {
  app: INestApplication;
  mail: FakeMailService;
  prisma: PrismaService;
  redis: RedisService;
  close: () => Promise<void>;
};

export async function createTestApp(): Promise<TestApp> {
  const mail = new FakeMailService();

  const moduleRef = await Test.createTestingModule({
    imports: [CoreModule],
  })
    .overrideProvider(MailService)
    .useValue(mail)
    .compile();

  const app = setupApp(moduleRef.createNestApplication());
  await app.init();

  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);

  return {
    app,
    mail,
    prisma,
    redis,
    close: async () => {
      await app.close();
      redis.disconnect();
    },
  };
}

/** Уникальная почта на каждый прогон: иначе второй запуск упрётся в "email занят". */
export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
}

/** Достаёт cookie сессии из ответа — ручной аналог curl-овской "банки" (-c/-b). */
export function extractCookies(res: { headers: Record<string, unknown> }): string[] {
  const raw = res.headers["set-cookie"];
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [String(raw)];
  return list.map((cookie) => cookie.split(";")[0]);
}
