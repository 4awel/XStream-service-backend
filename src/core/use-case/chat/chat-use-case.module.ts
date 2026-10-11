import { Module } from "@nestjs/common";

import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { EventsGatewayModule } from "@/core/events/events-gateway.module";
import { SecurityModule } from "@/core/security/security.module";
import { ChatUseCase } from "@/core/use-case/chat/chat.use-case";

@Module({
  imports: [PrismaDataServicesModule, EventsGatewayModule, SecurityModule],
  providers: [ChatUseCase],
  exports: [ChatUseCase],
})
export class ChatUseCaseModule {}
