import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
  ) {}

  /** Выдаёт новый ключ, старый перестаёт работать. */
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
      // Почти всегда это смена STREAM_KEY_SECRET: старые ключи больше не читаются.
      // Предлагаем сбросить, а не притворяемся, что ключа нет.
      throw new ConflictException(
        "Stream key cannot be decrypted, reset it to get a new one",
      );
    }

    return this.format(channel.id, key);
  }

  private format(channelId: string, key: string): StreamKeyResponse {
    return {
      server: this.media.rtmpUrl,
      // channelId — это путь публикации, key улетает строкой запроса:
      // именно её MediaMTX передаёт в /stream/auth как query.
      streamKey: `${channelId}?key=${key}`,
      playbackUrl: this.media.hlsPlaybackUrl(channelId),
    };
  }
}
