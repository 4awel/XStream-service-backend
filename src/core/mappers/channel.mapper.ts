import { Channel as PrismaChannel } from "@prisma/generated";
import { Channel } from "@/core/entity/channel.entity";

export class PrismaChannelMapper {
  private constructor() {
    throw new Error(
      "PrismaChannelMapper: is a static class and should not be instantiated",
    );
  }

  public static toEntity(channelPrisma: PrismaChannel): Channel {
    return new Channel({
      id: channelPrisma.id,
      streamerId: channelPrisma.streamerId,
      streamTitle: channelPrisma.streamTitle,
      streamDescription: channelPrisma.streamDescription,
      thumbnailUrl: channelPrisma.thumbnailUrl,
      isLive: channelPrisma.isLive,
      liveStartedAt: channelPrisma.liveStartedAt,
      blocked: channelPrisma.blocked,
      streamHashKey: channelPrisma.streamKeyHash,
      primaryCategoryId: channelPrisma.primaryCategoryId,
      bannerKey: channelPrisma.bannerKey,
      createdAt: channelPrisma.createdAt,
      updatedAt: channelPrisma.updatedAt,
    });
  }
}
