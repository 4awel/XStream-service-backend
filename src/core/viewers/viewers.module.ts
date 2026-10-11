import { Module } from "@nestjs/common";

import { ViewerCountService } from "@/core/viewers/viewer-count.service";

@Module({
  providers: [ViewerCountService],
  exports: [ViewerCountService],
})
export class ViewersModule {}
