import { Module } from "@nestjs/common";

import { BrowseController } from "@/core/browse/browse.controller";
import { BrowseUseCaseModule } from "@/core/use-case/browse/browse-use-case.module";

@Module({
  imports: [BrowseUseCaseModule],
  controllers: [BrowseController],
})
export class BrowseModule {}
