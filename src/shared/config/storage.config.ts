import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isDev } from "@/shared/utils/is-dev.util";

/** Дефолты совпадают с сервисом minio из docker-compose.yml. */
const DEV_DEFAULTS = {
  S3_ENDPOINT: "http://localhost:9000",
  S3_REGION: "us-east-1",
  S3_ACCESS_KEY: "minioadmin",
  S3_SECRET_KEY: "minioadmin",
  S3_BUCKET: "stream-media",
  S3_PUBLIC_URL: "http://localhost:9000/stream-media",
} as const;

type StorageKey = keyof typeof DEV_DEFAULTS;

/**
 * Настройки S3/MinIO. Как и MediaConfigService: в dev дефолты локального
 * docker-compose, в проде каждая переменная обязательна.
 */
@Injectable()
export class StorageConfigService {
  public readonly endpoint: string;
  public readonly region: string;
  public readonly accessKey: string;
  public readonly secretKey: string;
  public readonly bucket: string;
  /** База публичных ссылок: прямой адрес MinIO или путь за прокси (/media/<bucket>). */
  public readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.endpoint = this.read("S3_ENDPOINT");
    this.region = this.read("S3_REGION");
    this.accessKey = this.read("S3_ACCESS_KEY");
    this.secretKey = this.read("S3_SECRET_KEY");
    this.bucket = this.read("S3_BUCKET");
    this.publicUrl = this.read("S3_PUBLIC_URL").replace(/\/+$/, "");
  }

  private read(key: StorageKey): string {
    const value = this.config.get<string>(key);

    if (value !== undefined && value.trim().length > 0) {
      return value.trim();
    }

    if (isDev(this.config)) {
      return DEV_DEFAULTS[key];
    }

    throw new Error(`${key} is required outside development`);
  }
}
