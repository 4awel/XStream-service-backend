import { Module } from "@nestjs/common";

import { EventsGateway } from "@/core/events/events.gateway";
import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { SecurityModule } from "@/core/security/security.module";

@Module({
  imports: [PrismaDataServicesModule, SecurityModule],
  providers: [EventsGateway],
  // Экспортируем, чтобы ручки подписки и фоловов могли слать события в комнату.
  exports: [EventsGateway],
})
export class EventsModule {}
