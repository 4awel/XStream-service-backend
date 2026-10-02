import {
  MEDIAMTX_ACTIONS,
  MediaMtxAuthInput,
} from "@/core/use-case/stream/types/stream.use-case.types";
import type { MediaMtxAction } from "@/core/use-case/stream/types/stream.use-case.types";

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const isAction = (value: unknown): value is MediaMtxAction =>
  typeof value === "string" &&
  (MEDIAMTX_ACTIONS as readonly string[]).includes(value);

/**
 * Разбирает тело запроса MediaMTX вручную, без DTO и class-validator.
 *
 * Так сделано намеренно. У приложения глобальный ValidationPipe с
 * forbidNonWhitelisted, и любое поле, не описанное в DTO, превращается в 400 —
 * а для MediaMTX всё, кроме 2xx, означает «запретить публикацию». На этом уже
 * ломались: в версии 1.21 появилось поле userAgent, и стримы перестали пускаться.
 * Внешний вебхук не должен падать от того, что медиасервер завёл новое поле,
 * поэтому читаем только нужное и игнорируем остальное.
 *
 * Возвращает null, если запрос разобрать не удалось: непонятный запрос
 * к эндпоинту авторизации безопаснее отклонить, чем пропустить.
 */
export const parseMediaMtxAuthRequest = (
  body: unknown,
): MediaMtxAuthInput | null => {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const raw = body as Record<string, unknown>;

  if (!isAction(raw.action)) {
    return null;
  }

  return {
    action: raw.action,
    path: asString(raw.path),
    query: asString(raw.query),
    protocol: asString(raw.protocol),
    ip: asString(raw.ip),
  };
};
