import { ConfigService } from "@nestjs/config";
import { parseBoolean } from "@/shared/utils/parse-boolean.util";

export type SameSite = "lax" | "strict" | "none";

const SAME_SITE_VALUES: SameSite[] = ["lax", "strict", "none"];

/** express-session по умолчанию выдаёт cookie на "/" — повторяем явно. */
const SESSION_COOKIE_PATH = "/";

/**
 * В проде фронт и API стоят на разных доменах, значит cookie обязана быть
 * SameSite=None + Secure, иначе браузер её просто не отправит.
 * В dev оба на localhost — хватает lax.
 */
export const readSameSite = (config: ConfigService): SameSite => {
  const value = config.get<string>("SESSION_SAME_SITE", "lax");

  if (!SAME_SITE_VALUES.includes(value as SameSite)) {
    throw new Error(
      `SESSION_SAME_SITE must be one of: ${SAME_SITE_VALUES.join(", ")}`,
    );
  }

  return value as SameSite;
};

/** Намеренно узкий тип: подходит и express-session, и res.clearCookie. */
export interface SessionCookieOptions {
  /** undefined — cookie без Domain, браузер привяжет её к хосту ответа. */
  domain: string | undefined;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: SameSite;
}

/**
 * Атрибуты cookie сессии в одном месте.
 *
 * Их используют и express-session при выдаче (setup-app.ts), и выход при
 * удалении (login.controller.ts). Держать их вместе важно: clearCookie убирает
 * cookie только при совпадении domain и path, поэтому разъехавшиеся настройки
 * означали бы «вышел, но cookie осталась в браузере».
 */
export const sessionCookieOptions = (
  config: ConfigService,
): SessionCookieOptions => ({
  // Пустое значение — без Domain. Нужно, когда API проксируется через домен
  // фронта (Netlify -> Render): cookie должна принадлежать домену фронта.
  domain: config.get<string>("SESSION_DOMAIN")?.trim() || undefined,
  path: SESSION_COOKIE_PATH,
  httpOnly: parseBoolean(config.getOrThrow<string>("SESSION_HTTP_ONLY")),
  secure: parseBoolean(config.getOrThrow<string>("SESSION_SECURE")),
  sameSite: readSameSite(config),
});
