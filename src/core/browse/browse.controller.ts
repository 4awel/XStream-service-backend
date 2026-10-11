import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { OptionalUserId } from "@/core/auth/decorator/current-user-id.decorator";
import {
  CategoryPageResponse,
  CategoryStatsResponse,
  LimitQueryDto,
} from "@/core/browse/browse.dto";
import { IStorage } from "@/core/storage/storage.abstract";
import { ChannelTransformer } from "@/core/transformers/channel.transformer";
import { TagTransformer } from "@/core/transformers/tag.transformer";
import {
  BrowseUseCase,
  type CategoryStats,
} from "@/core/use-case/browse/browse.use-case";
import { PublicChannelResponse } from "@/core/user/dto/profile.dto";

const toStats = (stats: CategoryStats): CategoryStatsResponse => ({
  ...TagTransformer.toResponse(stats.tag),
  liveChannels: stats.liveChannels,
  liveViewers: stats.viewersCount,
  isInterest: stats.isInterest,
});

/** Каталог: главная, категории. Публичный — гостю тоже, только без персонализации. */
@Controller("browse")
@ApiTags("browse")
export class BrowseController {
  constructor(
    private readonly browseUseCase: BrowseUseCase,
    @Inject(IStorage) private readonly storage: IStorage,
  ) {}

  @ApiOkResponse({
    type: [PublicChannelResponse],
    description: "Эфиры под интересы зрителя, затем по числу зрителей",
  })
  @Get("recommended")
  async recommended(
    @OptionalUserId() viewerId: string | null,
    @Query() query: LimitQueryDto,
  ): Promise<PublicChannelResponse[]> {
    const channels = await this.browseUseCase.recommended(viewerId, query.limit ?? 24);
    return channels.map((live) => ChannelTransformer.toPublic(live, this.storage));
  }

  @ApiOkResponse({ type: [CategoryStatsResponse] })
  @Get("categories")
  async categories(
    @OptionalUserId() viewerId: string | null,
  ): Promise<CategoryStatsResponse[]> {
    const stats = await this.browseUseCase.categories(viewerId);
    return stats.map(toStats);
  }

  @ApiOkResponse({ type: CategoryPageResponse })
  @ApiNotFoundResponse({ description: "Нет такой категории" })
  @Get("categories/:slug")
  async category(
    @Param("slug") slug: string,
    @OptionalUserId() viewerId: string | null,
  ): Promise<CategoryPageResponse> {
    const { category, channels } = await this.browseUseCase.category(slug, viewerId);
    return {
      category: toStats(category),
      channels: channels.map((live) => ChannelTransformer.toPublic(live, this.storage)),
    };
  }
}
