import { Injectable } from "@nestjs/common";

import { ChannelView } from "@/core/entity/channel-view";
import { PrismaService } from "@/core/prisma/prisma.service";
import { FollowRepository } from "@/core/repositories/abstracts/follow.repository";
import {
  CHANNEL_VIEW_INCLUDE,
  toChannelView,
} from "@/core/repositories/prisma-repo/channel-view.select";

@Injectable()
export class PrismaFollowRepository extends FollowRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async follow(userId: string, channelId: string): Promise<boolean> {
    // skipDuplicates вместо find+create: два параллельных клика не дадут гонку.
    const { count } = await this.prisma.follow.createMany({
      data: [{ userId, channelId }],
      skipDuplicates: true,
    });
    return count > 0;
  }

  async unfollow(userId: string, channelId: string): Promise<boolean> {
    const { count } = await this.prisma.follow.deleteMany({
      where: { userId, channelId },
    });
    return count > 0;
  }

  async isFollowing(userId: string, channelId: string): Promise<boolean> {
    const row = await this.prisma.follow.findUnique({
      where: { userId_channelId: { userId, channelId } },
      select: { userId: true },
    });
    return row !== null;
  }

  countFollowers(channelId: string): Promise<number> {
    return this.prisma.follow.count({ where: { channelId } });
  }

  async listFollowed(userId: string, limit: number): Promise<ChannelView[]> {
    const rows = await this.prisma.channel.findMany({
      where: { followers: { some: { userId } }, blocked: false },
      include: CHANNEL_VIEW_INCLUDE,
      orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
      take: limit,
    });
    return rows.map(toChannelView);
  }
}
