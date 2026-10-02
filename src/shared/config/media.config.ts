import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isDev } from "@/shared/utils/is-dev.util";

/**
 * Адреса MediaMTX. В dev подставляются дефолты локального docker-compose,
 * в проде каждый адрес обязателен — иначе приложение не поднимется
 * и мы узнаем об опечатке на старте, а не когда стример нажмёт «Начать стрим».
 */
const DEV_DEFAULTS = {
  MEDIAMTX_RTMP_URL: "rtmp://localhost:1935",
  MEDIAMTX_HLS_URL: "http://localhost:8888",
  MEDIAMTX_WEBRTC_URL: "http://localhost:8889",
  MEDIAMTX_API_URL: "http://localhost:9997",
} as const;

type MediaUrlKey = keyof typeof DEV_DEFAULTS;

const DEFAULT_SYNC_INTERVAL_MS = 10_000;

const withoutTrailingSlash = (url: string): string => url.replace(/\/+$/, "");

@Injectable()
export class MediaConfigService {
  /** Адрес для поля «Сервер» в OBS. */
  public readonly rtmpUrl: string;
  /** База для HLS-плеера. */
  public readonly hlsUrl: string;
  /** База для WebRTC (WHEP). */
  public readonly webrtcUrl: string;
  /** Control API MediaMTX — нужен для сверки isLive. */
  public readonly apiUrl: string;
  /** Общий секрет для вебхуков runOnReady/runOnNotReady. */
  public readonly hookSecret: string;
  /** Период сверки isLive с MediaMTX; 0 — выключить. */
  public readonly syncIntervalMs: number;

  constructor(private readonly config: ConfigService) {
    this.rtmpUrl = this.readUrl("MEDIAMTX_RTMP_URL");
    this.hlsUrl = this.readUrl("MEDIAMTX_HLS_URL");
    this.webrtcUrl = this.readUrl("MEDIAMTX_WEBRTC_URL");
    this.apiUrl = this.readUrl("MEDIAMTX_API_URL");

    // Секрет обязателен и в dev: без него вебхуки открыты любому, кто знает порт.
    this.hookSecret = config.getOrThrow<string>("STREAM_HOOK_SECRET");

    const interval = Number(
      config.get<string>("MEDIAMTX_SYNC_INTERVAL_MS") ??
        DEFAULT_SYNC_INTERVAL_MS,
    );
    this.syncIntervalMs = Number.isFinite(interval) && interval >= 0
      ? interval
      : DEFAULT_SYNC_INTERVAL_MS;
  }

  public hlsPlaybackUrl(channelId: string): string {
    return `${this.hlsUrl}/${channelId}/index.m3u8`;
  }

  public webrtcPlaybackUrl(channelId: string): string {
    return `${this.webrtcUrl}/${channelId}/whep`;
  }

  private readUrl(key: MediaUrlKey): string {
    const value = isDev(this.config)
      ? this.config.get<string>(key, DEV_DEFAULTS[key])
      : this.config.getOrThrow<string>(key);

    return withoutTrailingSlash(value);
  }
}
