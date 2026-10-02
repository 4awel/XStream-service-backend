import { Module } from "@nestjs/common";
import { StreamController } from "@/core/stream/stream.controller";
import { StreamSyncService } from "@/core/stream/stream-sync.service";
import { StreamUseCaseModule } from "@/core/use-case/stream/stream-use-case.module";
import { MediaConfigModule } from "@/shared/config/media-config.module";

@Module({
  imports: [StreamUseCaseModule, MediaConfigModule],
  controllers: [StreamController],
  providers: [StreamSyncService],
})
export class StreamModule {}
