import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { type Request } from "express";
import { MediaConfigService } from "@/shared/config/media.config";
import { safeEqual } from "@/shared/utils/stream-key.util";

export const HOOK_SECRET_HEADER = "x-hook-secret";

/**
 * Вебхуки MediaMTX меняют isLive, то есть видимость канала на главной.
 * Без этой проверки любой, кто дотянулся до порта бэкенда, мог бы
 * объявить чужой канал «в эфире».
 */
@Injectable()
export class HookSecretGuard implements CanActivate {
  constructor(private readonly media: MediaConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header(HOOK_SECRET_HEADER) ?? "";

    if (!safeEqual(provided, this.media.hookSecret)) {
      throw new UnauthorizedException("Invalid hook secret");
    }

    return true;
  }
}
