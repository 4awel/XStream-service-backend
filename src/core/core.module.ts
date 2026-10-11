import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "@/core/auth/auth.module";
import { ChannelModule } from "@/core/channel/channel.module";
import { EventsModule } from "@/core/events/events.module";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { SessionModule } from "@/core/auth/session.module";
import { RedisModule } from "@/core/redis/redis.module";
import { StreamModule } from "@/core/stream/stream.module";
import { StorageModule } from "@/core/storage/storage.module";
import { TagModule } from "@/core/tag/tag.module";
import { BrowseModule } from "@/core/browse/browse.module";
import { UserModule } from "@/core/user/user.module";
import { IS_DEV_ENV } from "@/shared/utils/is-dev.util";

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: !IS_DEV_ENV,
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    StorageModule,
    SessionModule,
    UserModule,
    AuthModule,
    ChannelModule,
    StreamModule,
    EventsModule,
    TagModule,
    BrowseModule,
  ],
})
export class CoreModule {}
