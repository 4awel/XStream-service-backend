import { Channel } from "@/core/entity/channel.entity";
import { LiveChannel } from "@/core/entity/channel-view";
import { IStorage } from "@/core/storage/storage.abstract";
import { PublicChannelResponse } from "@/core/user/dto/profile.dto";
import { ChannelResponse } from "@/core/user/dto/user.dto";

export class ChannelTransformer {
  constructor() {
    throw new Error("Cannot instance of static class");
  }

  public static toResponse(channel: Channel, storage: IStorage): ChannelResponse {
    return {
      id: channel.id,
      streamDescription: channel.streamDescription,
      streamTitle: channel.streamTitle,
      thumbnailUrl: channel.thumbnailUrl,
      primaryCategoryId: channel.primaryCategoryId,
      isLive: channel.isLive,
      bannerUrl: storage.publicUrl(channel.bannerKey),
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }

  public static toPublic(
    { view, isFollowing, viewersCount }: LiveChannel,
    storage: IStorage,
  ): PublicChannelResponse {
    return {
      id: view.channel.id,
      isLive: view.channel.isLive,
      streamTitle: view.channel.streamTitle,
      streamDescription: view.channel.streamDescription,
      primaryCategoryId: view.channel.primaryCategoryId,
      bannerUrl: storage.publicUrl(view.channel.bannerKey),
      followersCount: view.followersCount,
      viewersCount: view.channel.isLive ? viewersCount : 0,
      liveStartedAt: view.channel.liveStartedAt?.toISOString() ?? null,
      category: view.category,
      isFollowing,
      streamer: {
        id: view.streamer.id,
        username: view.streamer.username,
        displayName: view.streamer.displayName,
        bio: view.streamer.bio,
        avatarUrl: storage.publicUrl(view.streamer.avatarKey),
      },
    };
  }
}
