import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { decryptStreamKey, safeEqual } from "@/shared/utils/stream-key.util";
import { channelIdFromPath } from "@/shared/utils/stream-path.util";
import { MediaMtxAuthInput } from "@/core/use-case/stream/types/stream.use-case.types";

@Injectable()
export class StreamUseCase {
  private readonly logger = new Logger(StreamUseCase.name);

  constructor(
    @Inject(IDataServices) private readonly dataService: IDataServices,
  ) {}

  async authorize(input: MediaMtxAuthInput): Promise<void> {
    if (input.action !== "publish") {
      return;
    }

    const channelId = channelIdFromPath(input.path);
    const key = new URLSearchParams(input.query ?? "").get("key");

    if (channelId === null || key === null || key.length === 0) {
      this.deny("путь или ключ не переданы", input);
    }

    const channel = await this.dataService.channel.findByChannelId(channelId);

    if (channel === null) {
      this.deny(`канала ${channelId} не существует`, input);
    }

    if (channel.blocked) {
      this.deny(`канал ${channelId} заблокирован`, input);
    }

    if (channel.streamHashKey === null) {
      this.deny(`у канала ${channelId} ещё не создан ключ`, input);
    }

    let expectedKey: string;
    try {
      expectedKey = decryptStreamKey(channel.streamHashKey);
    } catch {
      // Ключ не расшифровывается — чаще всего сменили STREAM_KEY_SECRET.
      this.deny(`ключ канала ${channelId} не расшифровывается`, input);
    }

    if (!safeEqual(expectedKey, key)) {
      this.deny(`неверный ключ для канала ${channelId}`, input);
    }

    this.logger.log(`Публикация разрешена: канал ${channelId}`);
  }

  /** Вебхук runOnReady / runOnNotReady: поток появился или пропал. */
  async setLive(path: string, isLive: boolean): Promise<void> {
    const channelId = channelIdFromPath(path);

    if (channelId === null) {
      this.logger.warn(`Вебхук с пустым путём, isLive=${isLive}`);
      return;
    }

    const updated = await this.dataService.channel.setLive(channelId, isLive);

    if (updated === 0) {
      this.logger.warn(`Вебхук про неизвестный канал ${channelId}`);
      return;
    }
    await this.dataService.chat.deleteByChannelIds([channelId]);

    this.logger.log(`Канал ${channelId}: isLive=${isLive}`);
  }
  async syncLive(livePaths: string[]): Promise<void> {
    const channelIds = livePaths
      .map((path) => channelIdFromPath(path))
      .filter((id): id is string => id !== null);

    const wentOffline = await this.dataService.channel.syncLive(channelIds);
    await this.dataService.chat.deleteByChannelIds(wentOffline);
  }

  /** never, чтобы TypeScript понимал: после вызова выполнение не продолжается. */
  private deny(reason: string, input: MediaMtxAuthInput): never {
    this.logger.warn(
      `Публикация отклонена (${reason}); ip=${input.ip ?? "?"}, protocol=${input.protocol ?? "?"}`,
    );
    throw new UnauthorizedException("Stream key is invalid");
  }
}
