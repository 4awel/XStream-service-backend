import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiExcludeController,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { StreamUseCase } from "@/core/use-case/stream/stream.use-case";
import { StreamHookQueryDto } from "@/core/stream/dto/stream.dto";
import { parseMediaMtxAuthRequest } from "@/core/stream/stream-auth.request";
import { HookSecretGuard } from "@/core/stream/guards/hook-secret.guard";

/**
 * Эндпоинты для MediaMTX, не для браузера. Снаружи их публиковать не нужно:
 * медиасервер ходит сюда по внутренней сети.
 */
@Controller("stream")
@ApiTags("stream")
@ApiExcludeController()
export class StreamController {
  constructor(
    @Inject(StreamUseCase) private readonly streamUseCase: StreamUseCase,
  ) {}

  @ApiOkResponse({ description: "Публикация разрешена" })
  @ApiUnauthorizedResponse({ description: "Неверный ключ потока" })
  @Post("auth")
  @HttpCode(HttpStatus.OK)
  async auth(@Body() body: Record<string, unknown>): Promise<void> {
    // Record<string, unknown> вместо DTO — чтобы глобальный ValidationPipe
    // не отклонял запрос из-за полей, которых мы ещё не знаем.
    const input = parseMediaMtxAuthRequest(body);

    if (input === null) {
      throw new UnauthorizedException("Malformed auth request");
    }

    await this.streamUseCase.authorize(input);
  }

  @ApiNoContentResponse({ description: "Поток появился — канал в эфире" })
  @Post("hooks/ready")
  @UseGuards(HookSecretGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async ready(@Query() query: StreamHookQueryDto): Promise<void> {
    await this.streamUseCase.setLive(query.path, true);
  }

  @ApiNoContentResponse({ description: "Поток пропал — канал не в эфире" })
  @Post("hooks/not-ready")
  @UseGuards(HookSecretGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async notReady(@Query() query: StreamHookQueryDto): Promise<void> {
    await this.streamUseCase.setLive(query.path, false);
  }
}
