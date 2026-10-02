import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { MediaConfigService } from "@/shared/config/media.config";
import { StreamUseCase } from "@/core/use-case/stream/stream.use-case";

const REQUEST_TIMEOUT_MS = 3_000;
const ITEMS_PER_PAGE = 1_000;
const MAX_PAGES = 50;

interface MediaMtxPath {
  name: string;
  ready: boolean;
}

interface MediaMtxPathsList {
  pageCount?: number;
  items?: MediaMtxPath[];
}

/**
 * Периодически сверяет isLive с тем, что реально отдаёт MediaMTX.
 *
 * Вебхуков недостаточно: если бэкенд лежал в момент, когда стример выключил OBS,
 * вебхук runOnNotReady потеряется и канал останется «в эфире» навсегда.
 * Эта сверка сама всё поправит на следующем тике.
 */
@Injectable()
export class StreamSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamSyncService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly media: MediaConfigService,
    private readonly streamUseCase: StreamUseCase,
  ) {}

  onModuleInit(): void {
    if (this.media.syncIntervalMs === 0) {
      this.logger.log("Сверка isLive с MediaMTX выключена");
      return;
    }

    this.timer = setInterval(() => {
      void this.sync();
    }, this.media.syncIntervalMs);

    // unref, чтобы таймер не держал процесс при остановке приложения.
    this.timer.unref();

    // Первый прогон сразу: после перезапуска состояние нужно починить, не ожидая тика.
    void this.sync();
  }

  onModuleDestroy(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async sync(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const livePaths = await this.fetchLivePaths();

      // null = MediaMTX недоступен. Молча ничего не делаем: гасить все каналы
      // из-за недоступности медиасервера было бы хуже, чем устаревший isLive.
      if (livePaths === null) {
        return;
      }

      await this.streamUseCase.syncLive(livePaths);
    } catch (error) {
      this.logger.warn(`Сверка isLive не удалась: ${describe(error)}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async fetchLivePaths(): Promise<string[] | null> {
    const paths: string[] = [];
    let page = 0;
    let pageCount = 1;

    // Постранично: если забрать только первую страницу, каналы со следующих
    // окажутся «не в эфире» и их погасит syncLive.
    while (page < pageCount && page < MAX_PAGES) {
      const url = `${this.media.apiUrl}/v3/paths/list?page=${page}&itemsPerPage=${ITEMS_PER_PAGE}`;

      let response: Response;
      try {
        response = await fetch(url, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        this.logger.debug(`MediaMTX недоступен: ${describe(error)}`);
        return null;
      }

      if (!response.ok) {
        this.logger.warn(`MediaMTX API ответил ${response.status}`);
        return null;
      }

      const body = (await response.json()) as MediaMtxPathsList;
      pageCount = body.pageCount ?? 1;

      for (const item of body.items ?? []) {
        if (item.ready) {
          paths.push(item.name);
        }
      }

      page += 1;
    }

    return paths;
  }
}

const describe = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
