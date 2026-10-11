import { Injectable } from "@nestjs/common";
import { ChannelRepository } from "@/core/repositories/abstracts/channel.repository";
import { PrismaService } from "@/core/prisma/prisma.service";
import { Channel } from "@/core/entity/channel.entity";
import { PrismaChannelMapper } from "@/core/mappers/channel.mapper";
import { ChannelView } from "@/core/entity/channel-view";
import type { UpdateChannelInfoProps } from "@/core/repositories/abstracts/props/user.props";
import {
  CHANNEL_VIEW_INCLUDE,
  toChannelView,
} from "@/core/repositories/prisma-repo/channel-view.select";

@Injectable()
export class PrismaChannelRepository extends ChannelRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByStreamerId(userId: string): Promise<Channel | null> {
    if (!userId) return null;

    const channel = await this.prisma.channel.findUnique({
      where: {
        streamerId: userId,
      },
    });

    if (!channel) return null;
    return PrismaChannelMapper.toEntity(channel);
  }

  async findByChannelId(channelId: string): Promise<Channel | null> {
    if (!channelId) return null;

    const channel = await this.prisma.channel.findUnique({
      where: {
        id: channelId,
      },
    });

    if (!channel) return null;
    return PrismaChannelMapper.toEntity(channel);
  }

  async resetStreamKey(userId: string, key: string): Promise<void> {
    await this.prisma.channel.update({
      where: {
        streamerId: userId,
      },
      data: {
        streamKeyHash: key,
      },
    });
  }

  async setLive(channelId: string, isLive: boolean): Promise<number> {
    // updateMany, а не update: на неизвестный путь не хочется получать исключение.
    // Время старта ставим только при переходе offline → live: повторный вебхук
    // runOnReady не должен обнулять «в эфире 2 часа».
    const exists = await this.prisma.channel.count({ where: { id: channelId } });

    if (exists === 0) {
      return 0;
    }

    await this.prisma.channel.updateMany({
      where: { id: channelId, isLive: !isLive },
      data: { isLive, liveStartedAt: isLive ? new Date() : null },
    });

    return exists;
  }

  async syncLive(liveChannelIds: string[]): Promise<string[]> {
    // Пустой in: [] у Prisma не трогает никого, пустой notIn: [] — трогает всех,
    // то есть «никто не вещает» корректно гасит все каналы.
    const wentOffline = await this.prisma.channel.findMany({
      where: { id: { notIn: liveChannelIds }, isLive: true },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.channel.updateMany({
        where: { id: { in: liveChannelIds }, isLive: false },
        data: { isLive: true, liveStartedAt: new Date() },
      }),
      this.prisma.channel.updateMany({
        where: { id: { notIn: liveChannelIds }, isLive: true },
        data: { isLive: false, liveStartedAt: null },
      }),
    ]);

    return wentOffline.map(({ id }) => id);
  }

  async updateInfo(
    channelId: string,
    props: UpdateChannelInfoProps,
  ): Promise<Channel> {
    const channel = await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        streamTitle: props.streamTitle,
        streamDescription: props.streamDescription,
        primaryCategoryId: props.primaryCategoryId,
      },
    });
    return PrismaChannelMapper.toEntity(channel);
  }

  async setBanner(channelId: string, bannerKey: string | null): Promise<void> {
    await this.prisma.channel.update({
      where: { id: channelId },
      data: { bannerKey },
    });
  }

  async findViewByUsername(username: string): Promise<ChannelView | null> {
    const row = await this.prisma.channel.findFirst({
      where: { streamer: { username } },
      include: CHANNEL_VIEW_INCLUDE,
    });
    return row ? toChannelView(row) : null;
  }

  async findViewById(channelId: string): Promise<ChannelView | null> {
    const row = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: CHANNEL_VIEW_INCLUDE,
    });
    return row ? toChannelView(row) : null;
  }

  async listLive(query: {
    limit: number;
    categoryId?: string;
  }): Promise<ChannelView[]> {
    const rows = await this.prisma.channel.findMany({
      where: {
        isLive: true,
        blocked: false,
        primaryCategoryId: query.categoryId,
      },
      include: CHANNEL_VIEW_INCLUDE,
      orderBy: { liveStartedAt: "desc" },
      take: query.limit,
    });
    return rows.map(toChannelView);
  }
}
