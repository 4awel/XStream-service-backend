import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { ChannelView, LiveChannel } from "@/core/entity/channel-view";
import { ViewerCountService } from "@/core/viewers/viewer-count.service";
import { SOCKET_EVENT } from "@/core/events/events";
import { EventsGateway } from "@/core/events/events.gateway";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { RateLimitService } from "@/core/security/rate-limit.service";

const FOLLOW_LIMIT = 30;
const FOLLOW_WINDOW_SEC = 60;
const MAX_FOLLOWED_LIST = 200;

export interface FollowState {
  isFollowing: boolean;
  followersCount: number;
}

@Injectable()
export class FollowUseCase {
  constructor(
    @Inject(IDataServices) private readonly dataService: IDataServices,
    private readonly events: EventsGateway,
    private readonly rateLimit: RateLimitService,
    private readonly viewers: ViewerCountService,
  ) {}

  async follow(userId: string, channelId: string): Promise<FollowState> {
    // Лимит против спама алертами «X подписался» через follow/unfollow по кругу.
    await this.rateLimit.consume(`follow:${userId}`, FOLLOW_LIMIT, FOLLOW_WINDOW_SEC);

    const view = await this.availableChannel(channelId);

    if (view.streamer.id === userId) {
      throw new BadRequestException("You cannot follow your own channel");
    }

    const isNew = await this.dataService.follow.follow(userId, channelId);
    const followersCount = await this.dataService.follow.countFollowers(channelId);

    // Алерт только на новый фолов: повторный клик не должен дёргать стримера.
    if (isNew) {
      const user = await this.dataService.user.findById(userId);

      if (user !== null) {
        this.events.emitToChannel(channelId, SOCKET_EVENT.Follow, {
          channelId,
          userId,
          username: user.username,
          followersCount,
        });
      }
    }

    return { isFollowing: true, followersCount };
  }

  async unfollow(userId: string, channelId: string): Promise<FollowState> {
    await this.rateLimit.consume(`follow:${userId}`, FOLLOW_LIMIT, FOLLOW_WINDOW_SEC);
    await this.dataService.follow.unfollow(userId, channelId);

    return {
      isFollowing: false,
      followersCount: await this.dataService.follow.countFollowers(channelId),
    };
  }

  async listFollowed(userId: string): Promise<LiveChannel[]> {
    const views = await this.dataService.follow.listFollowed(userId, MAX_FOLLOWED_LIST);
    const viewers = await this.viewers.getMany(views.map((view) => view.channel.id));

    return views.map((view) => ({
      view,
      isFollowing: true,
      viewersCount: viewers.get(view.channel.id) ?? 0,
    }));
  }

  private async availableChannel(channelId: string): Promise<ChannelView> {
    const view = await this.dataService.channel.findViewById(channelId);

    if (view === null || view.channel.blocked) {
      throw new NotFoundException("Channel not found");
    }

    return view;
  }
}
