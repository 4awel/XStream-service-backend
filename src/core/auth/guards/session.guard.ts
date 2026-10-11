import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import "@/core/auth/session.types";

/** Пускает только запросы с живой сессией. Сам пользователь — через @CurrentUserId(). */
@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.session?.userId === undefined) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
