import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Channel } from "@/core/entity/channel.entity";
import { ChannelView, LiveChannel } from "@/core/entity/channel-view";
import { ViewerCountService } from "@/core/viewers/viewer-count.service";
import type { UpdateChannelInfoProps } from "@/core/repositories/abstracts/props/user.props";
import { RateLimitService } from "@/core/security/rate-limit.service";
import { ImageProcessor } from "@/core/storage/image.processor";
import { IStorage } from "@/core/storage/storage.abstract";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { MediaConfigService } from "@/shared/config/media.config";
import {
  decryptStreamKey,
  encryptStreamKey,
  generateStreamKey,
} from "@/shared/utils/stream-key.util";
import { StreamKeyResponse } from "@/core/use-case/channel/types/channel.use-case.types";

@Injectable()
export class ChannelUseCase {
  constructor(
    @Inject(IDataServices) private readonly dataService: IDataServices,
    private readonly media: MediaConfigService,
    @Inject(IStorage) private readonly storage: IStorage,
    private readonly images: ImageProcessor,
    private readonly rateLimit: RateLimitService,
    private readonly viewers: ViewerCountService,
  ) {}

  async getPublicChannel(
    username: string,
    viewerId: string | null,
  ): Promise<LiveChannel> {
    const view = await this.dataService.channel.findViewByUsername(
      username.toLowerCase(),
    );
    return this.toLive(view, viewerId);
  }

  async getPublicChannelById(
    channelId: string,
    viewerId: string | null,
  ): Promise<LiveChannel> {
    const view = await this.dataService.channel.findViewById(channelId);
    return this.toLive(view, viewerId);
  }

  private async toLive(
    view: ChannelView | null,
    viewerId: string | null,
  ): Promise<LiveChannel> {
    if (view === null || view.channel.blocked) {
      throw new NotFoundException("Channel not found");
    }

    const [isFollowing, viewersCount] = await Promise.all([
      viewerId === null
        ? false
        : this.dataService.follow.isFollowing(viewerId, view.channel.id),
      this.viewers.get(view.channel.id),
    ]);

    return { view, isFollowing, viewersCount };
  }

  async updateInfo(
    userId: string,
    props: UpdateChannelInfoProps,
  ): Promise<Channel> {
    const channel = await this.ownChannel(userId);

    if (props.primaryCategoryId) {
      const category = await this.dataService.tag.findById(
        props.primaryCategoryId,
      );

      if (category === null || !category.canBePrimary()) {
        throw new BadRequestException("Unknown category");
      }
    }

    return this.dataService.channel.updateInfo(channel.id, props);
  }

  async uploadBanner(userId: string, file: Buffer): Promise<Channel> {
    await this.rateLimit.consume(`upload:${userId}`, 10, 10 * 60);

    const channel = await this.ownChannel(userId);
    const image = await this.images.process(file, "banner");
    const key = `banners/${channel.id}/${randomUUID()}.${image.extension}`;

    await this.storage.put(key, image.body, image.contentType);
    await this.dataService.channel.setBanner(channel.id, key);

    if (channel.bannerKey !== null) {
      await this.storage.delete(channel.bannerKey);
    }

    return this.ownChannel(userId);
  }

  async removeBanner(userId: string): Promise<Channel> {
    const channel = await this.ownChannel(userId);

    if (channel.bannerKey !== null) {
      await this.dataService.channel.setBanner(channel.id, null);
      await this.storage.delete(channel.bannerKey);
    }

    return this.ownChannel(userId);
  }

  private async ownChannel(userId: string): Promise<Channel> {
    const channel = await this.dataService.channel.findByStreamerId(userId);
    if (channel === null) throw new NotFoundException("Channel not found");
    return channel;
  }

  async resetStreamKey(userId: string): Promise<StreamKeyResponse> {
    const channel = await this.dataService.channel.findByStreamerId(userId);
    if (channel === null) throw new NotFoundException("Channel not found");

    const key = generateStreamKey();
    await this.dataService.channel.resetStreamKey(
      userId,
      encryptStreamKey(key),
    );

    return this.format(channel.id, key);
  }

  /** Показывает стримеру его текущий ключ. */
  async getStreamKey(userId: string): Promise<StreamKeyResponse> {
    const channel = await this.dataService.channel.findByStreamerId(userId);
    if (channel === null) throw new NotFoundException("Channel not found");
    if (channel.streamHashKey === null) {
      throw new NotFoundException("Stream key not created yet");
    }

    let key: string;
    try {
      key = decryptStreamKey(channel.streamHashKey);
    } catch {
      throw new ConflictException(
        "Stream key cannot be decrypted, reset it to get a new one",
      );
    }

    return this.format(channel.id, key);
  }

  private format(channelId: string, key: string): StreamKeyResponse {
    return {
      server: this.media.rtmpUrl,
      streamKey: `${channelId}?key=${key}`,
      playbackUrl: this.media.hlsPlaybackUrl(channelId),
    };
  }
}
