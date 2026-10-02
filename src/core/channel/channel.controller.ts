import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { type Request } from "express";
import { ChannelUseCase } from "@/core/use-case/channel/channel.use-case";
import { StreamKeyResponse } from "@/core/channel/dto/channel";

@Controller("channel")
@ApiTags("channel")
export class ChannelController {
  constructor(
    @Inject(ChannelUseCase)
    private readonly channelUseCase: ChannelUseCase,
  ) {}

  @ApiOkResponse({
    type: StreamKeyResponse,
    description: "Текущий ключ потока для OBS",
  })
  @ApiUnauthorizedResponse({ description: "Нет сессии" })
  @ApiNotFoundResponse({ description: "Ключ ещё не создан — сбросьте его" })
  @ApiConflictResponse({ description: "Ключ не расшифровывается — сбросьте его" })
  @Get("stream-key")
  async getStreamKey(@Req() req: Request): Promise<StreamKeyResponse> {
    return this.channelUseCase.getStreamKey(this.userId(req));
  }

  @ApiOkResponse({
    type: StreamKeyResponse,
    description: "Новый ключ потока; прежний сразу перестаёт работать",
  })
  @ApiUnauthorizedResponse({ description: "Нет сессии" })
  @Post("stream-key/reset")
  @HttpCode(HttpStatus.OK)
  async resetStreamKey(@Req() req: Request): Promise<StreamKeyResponse> {
    return this.channelUseCase.resetStreamKey(this.userId(req));
  }

  private userId(req: Request): string {
    const userId = req.session?.userId;

    if (userId === undefined) {
      throw new UnauthorizedException();
    }

    return userId;
  }
}
