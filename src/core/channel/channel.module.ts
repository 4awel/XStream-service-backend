import { Module } from "@nestjs/common";
import { ChannelController } from "@/core/channel/channel.controller";
import { ChannelUseCaseModule } from "@/core/use-case/channel/channel-use-case.module";
import { AuthUseCaseModule } from "@/core/use-case/auth/auth-use-case.module";

@Module({
    imports: [ChannelUseCaseModule, AuthUseCaseModule],
    controllers: [ChannelController]
})

export class ChannelModule {}