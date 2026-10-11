import { Global, Module } from "@nestjs/common";

import { ImageProcessor } from "@/core/storage/image.processor";
import { S3Storage } from "@/core/storage/s3.storage";
import { IStorage } from "@/core/storage/storage.abstract";
import { StorageConfigService } from "@/shared/config/storage.config";

/** Global: хранилище нужно и use case-ам, и трансформерам ответов (publicUrl). */
@Global()
@Module({
  providers: [
    StorageConfigService,
    ImageProcessor,
    { provide: IStorage, useClass: S3Storage },
  ],
  exports: [IStorage, ImageProcessor],
})
export class StorageModule {}
