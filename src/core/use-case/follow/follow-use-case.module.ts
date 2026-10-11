import { Module } from "@nestjs/common";

import { EventsGatewayModule } from "@/core/events/events-gateway.module";
import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { SecurityModule } from "@/core/security/security.module";
import { ViewersModule } from "@/core/viewers/viewers.module";
import { FollowUseCase } from "@/core/use-case/follow/follow.use-case";

@Module({
  imports: [PrismaDataServicesModule, EventsGatewayModule, SecurityModule, ViewersModule],
  providers: [FollowUseCase],
  exports: [FollowUseCase],
})
export class FollowUseCaseModule {}
