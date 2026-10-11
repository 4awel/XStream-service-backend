import { PrismaChannelMapper } from "@/core/mappers/channel.mapper";
import { ChannelView } from "@/core/entity/channel-view";
import type { Prisma } from "@prisma/generated";

/**
 * Один include для всех мест, где нужен ChannelView: стример, категория, теги
 * и счётчик фоловеров одним запросом (без N+1 на списках).
 */
export const CHANNEL_VIEW_INCLUDE = {
  streamer: {
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatar: true,
    },
  },
  primaryCategory: { select: { id: true, slug: true, title: true } },
  channelTags: { select: { tagId: true } },
  _count: { select: { followers: true } },
} satisfies Prisma.ChannelInclude;

type ChannelViewRow = Prisma.ChannelGetPayload<{
  include: typeof CHANNEL_VIEW_INCLUDE;
}>;

export const toChannelView = (row: ChannelViewRow): ChannelView => ({
  channel: PrismaChannelMapper.toEntity(row),
  streamer: {
    id: row.streamer.id,
    username: row.streamer.username,
    displayName: row.streamer.displayName,
    bio: row.streamer.bio,
    avatarKey: row.streamer.avatar,
  },
  category: row.primaryCategory,
  tagIds: row.channelTags.map(({ tagId }) => tagId),
  followersCount: row._count.followers,
});
