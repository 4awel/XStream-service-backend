import { Channel } from "@/core/entity/channel.entity";
import { ChannelView } from "@/core/entity/channel-view";
import type { UpdateChannelInfoProps } from "@/core/repositories/abstracts/props/user.props";

export abstract class ChannelRepository {
  abstract findByStreamerId(userId: string): Promise<Channel | null>;

  abstract findByChannelId(channelId: string): Promise<Channel | null>;

  abstract resetStreamKey(userId: string, key: string): Promise<void>;

  abstract setLive(channelId: string, isLive: boolean): Promise<number>;

  abstract syncLive(liveChannelIds: string[]): Promise<string[]>;

  abstract updateInfo(
    channelId: string,
    props: UpdateChannelInfoProps,
  ): Promise<Channel>;

  abstract setBanner(
    channelId: string,
    bannerKey: string | null,
  ): Promise<void>;

  abstract findViewByUsername(username: string): Promise<ChannelView | null>;

  abstract findViewById(channelId: string): Promise<ChannelView | null>;

  abstract listLive(query: {
    limit: number;
    categoryId?: string;
  }): Promise<ChannelView[]>;
}
