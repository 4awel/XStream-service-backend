import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "@/core/auth/auth.module";
import { ChannelModule } from "@/core/channel/channel.module";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { RedisModule } from "@/core/redis/redis.module";
import { StreamModule } from "@/core/stream/stream.module";
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
    UserModule,
    AuthModule,
    ChannelModule,
    StreamModule,
  ],
})
export class CoreModule {}
