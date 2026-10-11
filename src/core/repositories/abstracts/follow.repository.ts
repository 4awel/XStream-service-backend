import { ChannelView } from "@/core/entity/channel-view";

export abstract class FollowRepository {
  abstract follow(userId: string, channelId: string): Promise<boolean>;

  abstract unfollow(userId: string, channelId: string): Promise<boolean>;

  abstract isFollowing(userId: string, channelId: string): Promise<boolean>;

  abstract countFollowers(channelId: string): Promise<number>;

  abstract listFollowed(userId: string, limit: number): Promise<ChannelView[]>;
}
