import { Module } from "@nestjs/common";

import { EventsGateway } from "@/core/events/events.gateway";
import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { ViewersModule } from "@/core/viewers/viewers.module";

@Module({
  imports: [PrismaDataServicesModule, ViewersModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsGatewayModule {}
