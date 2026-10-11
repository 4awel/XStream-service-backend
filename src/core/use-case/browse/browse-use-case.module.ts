import { Module } from "@nestjs/common";

import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { BrowseUseCase } from "@/core/use-case/browse/browse.use-case";
import { ViewersModule } from "@/core/viewers/viewers.module";

@Module({
  imports: [PrismaDataServicesModule, ViewersModule],
  providers: [BrowseUseCase],
  exports: [BrowseUseCase],
})
export class BrowseUseCaseModule {}
