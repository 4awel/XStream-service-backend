import { Module } from "@nestjs/common";
import { MediaConfigService } from "@/shared/config/media.config";

@Module({
  providers: [MediaConfigService],
  exports: [MediaConfigService],
})
export class MediaConfigModule {}
