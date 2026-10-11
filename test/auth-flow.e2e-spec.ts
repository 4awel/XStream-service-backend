import { INestApplication } from "@nestjs/common";
import request from "supertest";

import { PrismaService } from "@/core/prisma/prisma.service";
import { RedisService } from "@/core/redis/redis.service";
import {
  createTestApp,
  extractCookies,
  FakeMailService,
  uniqueEmail,
} from "./utils/create-test-app";

const PASSWORD = "Str0ngPassw0rd!";

describe("Регистрация и /user/me (e2e)", () => {
  let app: INestApplication;
  let mail: FakeMailService;
  let prisma: PrismaService;
  let redis: RedisService;
  let close: () => Promise<void>;

  const createdEmails: string[] = [];

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    mail = ctx.mail;
    prisma = ctx.prisma;
    redis = ctx.redis;
    close = ctx.close;

    const keys = await redis.keys("rl:*");
    if (keys.length > 0) await redis.del(...keys);
  });

  afterAll(async () => {
    if (createdEmails.length > 0) {
      // channel удалится каскадом вслед за user
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
      await prisma.emailVerification.deleteMany({
        where: { email: { in: createdEmails } },
      });
    }
    await close();
  });

  it("проходит весь путь: register -> verify -> me", async () => {
    const email = uniqueEmail();
    createdEmails.push(email);

    // 1. POST /auth/register — ответ намеренно одинаковый для свободной и занятой почты
    const register = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password: PASSWORD })
      .expect(200);

    expect(register.body).toEqual({
      status: 200,
      message: expect.stringContaining("verification code has been sent"),
    });

    // 2. Код: в скрипте его вводят руками из письма, здесь берём у поддельной почты
    const code = mail.codeFor(email);
    expect(code).toMatch(/^\d{6}$/);

    const verify = await request(app.getHttpServer())
      .post("/auth/verify")
      .send({ email, code })
      .expect(200);

    expect(verify.body).toEqual({ status: 200, message: "Account created" });

    const cookies = extractCookies(verify);
    const sessionName = process.env.SESSION_NAME as string;
    expect(cookies.join(";")).toContain(sessionName);

    // 3. GET /user/me — тем же cookie, что curl хранил в банке
    const me = await request(app.getHttpServer())
      .get("/user/me")
      .set("Cookie", cookies)
      .expect(200);

    expect(me.body).toMatchObject({
      id: expect.any(String),
      email,
      username: expect.any(String),
      isEmailVerified: false,
      channel: { id: expect.any(String), isLive: false },
    });

    let user = JSON.parse(me.text);
    const NEWPASSWORD = "chawel@1357";
    const changePassword = await request(app.getHttpServer())
      .patch("/user/password")
      .set("Cookie", cookies)
      .send({ id: user.id, oldPassword: PASSWORD, newPassword: NEWPASSWORD })
      .expect(200);

    expect(changePassword.body).toEqual({
      status: 200,
      message: "Password changed",
    });

    const resetStreamKey = await request(app.getHttpServer())
      .post("/channel/stream-key/reset")
      .set("Cookie", cookies)
      .expect(200);
    expect(resetStreamKey.body).toMatchObject({
      server: expect.any(String),
      streamKey: expect.any(String),
    });

    // пароль наружу уходить не должен
    expect(me.body).not.toHaveProperty("password");
  });

  it("возвращает 401 на /user/me без cookie", async () => {
    await request(app.getHttpServer()).get("/user/me").expect(401);
  });

  it("не пускает с неверным кодом и не создаёт пользователя", async () => {
    const email = uniqueEmail("e2e-badcode");
    createdEmails.push(email);

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password: PASSWORD })
      .expect(200);

    const realCode = mail.codeFor(email);
    const wrongCode = realCode === "000000" ? "111111" : "000000";

    const res = await request(app.getHttpServer())
      .post("/auth/verify")
      .send({ email, code: wrongCode })
      .expect(400);

    expect(res.body.message).toBe("Invalid or expired verification code");
    expect(await prisma.user.count({ where: { email } })).toBe(0);
  });

  it("не принимает слабый пароль (валидация DTO)", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: uniqueEmail("e2e-weak"), password: "short" })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining("password")]),
    );
  });
});
