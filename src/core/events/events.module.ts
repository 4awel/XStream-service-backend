import { Module } from "@nestjs/common";

import { ChatGateway } from "@/core/events/chat.gateway";
import { EventsGatewayModule } from "@/core/events/events-gateway.module";
import { ChatUseCaseModule } from "@/core/use-case/chat/chat-use-case.module";

@Module({
  imports: [EventsGatewayModule, ChatUseCaseModule],
  providers: [ChatGateway],
})
export class EventsModule {}
