import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { ChannelView, LiveChannel } from "@/core/entity/channel-view";
import { Tag } from "@/core/entity/tag.entity";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { ViewerCountService } from "@/core/viewers/viewer-count.service";

const LIVE_POOL = 500;

export interface CategoryStats {
  tag: Tag;
  liveChannels: number;
  viewersCount: number;
  /** Категория из интересов зрителя — фронт может подсветить. */
  isInterest: boolean;
}

@Injectable()
export class BrowseUseCase {
  constructor(
    @Inject(IDataServices) private readonly dataService: IDataServices,
    private readonly viewers: ViewerCountService,
  ) {}

  async recommended(viewerId: string | null, limit: number): Promise<LiveChannel[]> {
    const [views, weights] = await Promise.all([
      this.dataService.channel.listLive({ limit: LIVE_POOL }),
      viewerId === null
        ? Promise.resolve(new Map<string, number>())
        : this.dataService.tag.interestWeights(viewerId),
    ]);

    // Свой эфир себе не рекомендуем.
    const candidates = views.filter((view) => view.streamer.id !== viewerId);
    const viewers = await this.viewersOf(candidates);

    const score = (view: ChannelView): number => {
      const tagIds = view.category ? [view.category.id, ...view.tagIds] : view.tagIds;
      return tagIds.reduce((sum, tagId) => sum + (weights.get(tagId) ?? 0), 0);
    };

    return candidates
      .map((view) => ({
        live: this.toLive(view, viewers),
        score: score(view),
      }))
      .sort(
        (a, b) =>
          b.score - a.score || b.live.viewersCount - a.live.viewersCount,
      )
      .slice(0, limit)
      .map(({ live }) => live);
  }

  /** Все видимые категории с тем, сколько в них сейчас эфиров и зрителей. */
  async categories(viewerId: string | null): Promise<CategoryStats[]> {
    const [tags, views, weights] = await Promise.all([
      this.dataService.tag.list({ kinds: ["CATEGORY"], limit: 200 }),
      this.dataService.channel.listLive({ limit: LIVE_POOL }),
      viewerId === null
        ? Promise.resolve(new Map<string, number>())
        : this.dataService.tag.interestWeights(viewerId),
    ]);
    const viewers = await this.viewersOf(views);

    const stats = new Map<string, { live: number; viewers: number }>();
    for (const view of views) {
      if (view.category === null) continue;
      const current = stats.get(view.category.id) ?? { live: 0, viewers: 0 };
      current.live += 1;
      current.viewers += viewers.get(view.channel.id) ?? 0;
      stats.set(view.category.id, current);
    }

    return tags
      .map((tag) => ({
        tag,
        liveChannels: stats.get(tag.id)?.live ?? 0,
        viewersCount: stats.get(tag.id)?.viewers ?? 0,
        isInterest: weights.has(tag.id),
      }))
      .sort(
        (a, b) =>
          b.viewersCount - a.viewersCount ||
          b.liveChannels - a.liveChannels ||
          Number(b.isInterest) - Number(a.isInterest) ||
          a.tag.title.localeCompare(b.tag.title, "ru"),
      );
  }

  /** Страница категории: сама категория и её эфиры по зрителям. */
  async category(
    slug: string,
    viewerId: string | null,
  ): Promise<{ category: CategoryStats; channels: LiveChannel[] }> {
    const tag = await this.dataService.tag.findBySlug(slug);

    if (tag === null || !tag.canBePrimary()) {
      throw new NotFoundException("Category not found");
    }

    const [views, weights] = await Promise.all([
      this.dataService.channel.listLive({ limit: LIVE_POOL, categoryId: tag.id }),
      viewerId === null
        ? Promise.resolve(new Map<string, number>())
        : this.dataService.tag.interestWeights(viewerId),
    ]);
    const viewers = await this.viewersOf(views);
    const channels = views
      .map((view) => this.toLive(view, viewers))
      .sort((a, b) => b.viewersCount - a.viewersCount);

    return {
      category: {
        tag,
        liveChannels: channels.length,
        viewersCount: channels.reduce((sum, live) => sum + live.viewersCount, 0),
        isInterest: weights.has(tag.id),
      },
      channels,
    };
  }

  private viewersOf(views: ChannelView[]): Promise<Map<string, number>> {
    return this.viewers.getMany(views.map((view) => view.channel.id));
  }

  private toLive(view: ChannelView, viewers: Map<string, number>): LiveChannel {
    // isFollowing на карточках не нужен: кнопка подписки — на странице канала.
    return {
      view,
      isFollowing: false,
      viewersCount: viewers.get(view.channel.id) ?? 0,
    };
  }
}
