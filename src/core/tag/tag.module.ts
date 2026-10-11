import { Module } from "@nestjs/common";

import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { TagController } from "@/core/tag/tag.controller";

@Module({
  imports: [PrismaDataServicesModule],
  controllers: [TagController],
})
export class TagModule {}
