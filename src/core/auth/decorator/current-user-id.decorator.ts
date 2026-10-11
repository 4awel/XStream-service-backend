import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import "@/core/auth/session.types";

/**
 * id пользователя из сессии. Без SessionGuard тоже безопасен: бросит 401,
 * а не вернёт undefined, который потом молча уйдёт в запрос к базе.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const userId = ctx.switchToHttp().getRequest<Request>().session?.userId;

    if (userId === undefined) {
      throw new UnauthorizedException();
    }

    return userId;
  },
);

/** Для публичных ручек, где вход необязателен (например, «подписан ли я»). */
export const OptionalUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null =>
    ctx.switchToHttp().getRequest<Request>().session?.userId ?? null,
);
