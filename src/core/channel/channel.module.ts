import { Module } from "@nestjs/common";
import { ChannelController } from "@/core/channel/channel.controller";
import { ChannelUseCaseModule } from "@/core/use-case/channel/channel-use-case.module";
import { ChatUseCaseModule } from "@/core/use-case/chat/chat-use-case.module";
import { FollowUseCaseModule } from "@/core/use-case/follow/follow-use-case.module";

@Module({
  imports: [ChannelUseCaseModule, ChatUseCaseModule, FollowUseCaseModule],
  controllers: [ChannelController],
})
export class ChannelModule {}
