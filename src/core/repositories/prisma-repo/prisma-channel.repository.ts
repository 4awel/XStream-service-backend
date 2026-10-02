import { Injectable } from "@nestjs/common";
import { ChannelRepository } from "@/core/repositories/abstracts/channel.repository";
import { PrismaService } from "@/core/prisma/prisma.service";
import { Channel } from "@/core/entity/channel.entity";
import { PrismaChannelMapper } from "@/core/mappers/channel.mapper";

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
    const { count } = await this.prisma.channel.updateMany({
      where: {
        id: channelId,
      },
      data: {
        isLive,
      },
    });

    return count;
  }

  async syncLive(liveChannelIds: string[]): Promise<void> {
    // Пустой in: [] у Prisma не трогает никого, пустой notIn: [] — трогает всех,
    // то есть «никто не вещает» корректно гасит все каналы.
    await this.prisma.$transaction([
      this.prisma.channel.updateMany({
        where: { id: { in: liveChannelIds }, isLive: false },
        data: { isLive: true },
      }),
      this.prisma.channel.updateMany({
        where: { id: { notIn: liveChannelIds }, isLive: true },
        data: { isLive: false },
      }),
    ]);
  }
}
