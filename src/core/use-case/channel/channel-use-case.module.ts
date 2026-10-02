import { Module } from "@nestjs/common";
import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { ChannelUseCase } from "@/core/use-case/channel/channel.use-case";
import { MediaConfigModule } from "@/shared/config/media-config.module";

@Module({
  imports: [PrismaDataServicesModule, MediaConfigModule],
  providers: [ChannelUseCase],
  exports: [ChannelUseCase],
})
export class ChannelUseCaseModule {}
