import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { IStorage } from "@/core/storage/storage.abstract";
import { StorageConfigService } from "@/shared/config/storage.config";

@Injectable()
export class S3Storage extends IStorage implements OnModuleInit {
  private readonly logger = new Logger(S3Storage.name);
  private readonly client: S3Client;

  constructor(private readonly config: StorageConfigService) {
    super();
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      // MinIO адресует бакеты путём (host/bucket/key), а не поддоменом.
      forcePathStyle: true,
    });
  }

  /**
   * Создаём бакет и открываем на чтение только GetObject: список файлов
   * (ListBucket) остаётся закрытым, чужие ключи перебором не найти.
   */
  async onModuleInit(): Promise<void> {
    // Без хранилища приложение всё равно должно подняться: вход, каталог и
    // профили работают, падать будут только загрузки файлов.
    try {
      await this.ensureBucket();
    } catch (error) {
      this.logger.warn(
        `S3 недоступно, загрузка файлов работать не будет: ${(error as Error).message}`,
      );
    }
  }

  private async ensureBucket(): Promise<void> {
    const Bucket = this.config.bucket;

    try {
      await this.client.send(new HeadBucketCommand({ Bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket }));
      this.logger.log(`Создан бакет ${Bucket}`);
    }

    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${Bucket}/*`],
            },
          ],
        }),
      }),
    );
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Ключи уникальны на каждую загрузку, поэтому файл можно кэшировать навсегда.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
    } catch (error) {
      // Сирота в бакете безвредна, а падать из-за неё на смене аватарки — нет.
      this.logger.warn(`Не удалось удалить ${key}: ${(error as Error).message}`);
    }
  }

  publicUrl(key: string | null): string | null {
    return key === null ? null : `${this.config.publicUrl}/${key}`;
  }
}
