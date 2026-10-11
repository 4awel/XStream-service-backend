import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import {
  CurrentUserId,
  OptionalUserId,
} from "@/core/auth/decorator/current-user-id.decorator";
import { SessionGuard } from "@/core/auth/guards/session.guard";
import {
  ChatHistoryQuery,
  ChatHistoryResponse,
  StreamKeyResponse,
} from "@/core/channel/dto/channel";
import { IStorage } from "@/core/storage/storage.abstract";
import { ChannelTransformer } from "@/core/transformers/channel.transformer";
import { ChannelUseCase } from "@/core/use-case/channel/channel.use-case";
import { ChatUseCase } from "@/core/use-case/chat/chat.use-case";
import { FollowUseCase } from "@/core/use-case/follow/follow.use-case";
import {
  FollowResponse,
  PublicChannelResponse,
  UpdateChannelDto,
} from "@/core/user/dto/profile.dto";
import { ChannelResponse } from "@/core/user/dto/user.dto";
import { imageUploadOptions, requireFile } from "@/core/user/upload.pipe";

@Controller("channel")
@ApiTags("channel")
export class ChannelController {
  constructor(
    @Inject(ChannelUseCase) private readonly channelUseCase: ChannelUseCase,
    private readonly chatUseCase: ChatUseCase,
    private readonly followUseCase: FollowUseCase,
    @Inject(IStorage) private readonly storage: IStorage,
  ) {}

  // ---------- свой канал ----------

  @ApiOkResponse({ type: StreamKeyResponse, description: "Текущий ключ потока для OBS" })
  @ApiUnauthorizedResponse({ description: "Нет сессии" })
  @ApiNotFoundResponse({ description: "Ключ ещё не создан — сбросьте его" })
  @ApiConflictResponse({ description: "Ключ не расшифровывается — сбросьте его" })
  @Get("stream-key")
  @UseGuards(SessionGuard)
  async getStreamKey(@CurrentUserId() userId: string): Promise<StreamKeyResponse> {
    return this.channelUseCase.getStreamKey(userId);
  }

  @ApiOkResponse({
    type: StreamKeyResponse,
    description: "Новый ключ потока; прежний сразу перестаёт работать",
  })
  @Post("stream-key/reset")
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async resetStreamKey(@CurrentUserId() userId: string): Promise<StreamKeyResponse> {
    return this.channelUseCase.resetStreamKey(userId);
  }

  @ApiOkResponse({ type: ChannelResponse, description: "Название, описание, категория" })
  @Patch()
  @UseGuards(SessionGuard)
  async updateChannel(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateChannelDto,
  ): Promise<ChannelResponse> {
    const channel = await this.channelUseCase.updateInfo(userId, dto);
    return ChannelTransformer.toResponse(channel, this.storage);
  }

  @ApiOkResponse({ type: ChannelResponse, description: "Шапка канала, 1600×400 webp" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: { type: "object", properties: { file: { type: "string", format: "binary" } } },
  })
  @Post("banner")
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @UseInterceptors(FileInterceptor("file", imageUploadOptions))
  async uploadBanner(
    @CurrentUserId() userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ChannelResponse> {
    const channel = await this.channelUseCase.uploadBanner(userId, requireFile(file));
    return ChannelTransformer.toResponse(channel, this.storage);
  }

  @ApiOkResponse({ type: ChannelResponse })
  @Delete("banner")
  @UseGuards(SessionGuard)
  async removeBanner(@CurrentUserId() userId: string): Promise<ChannelResponse> {
    const channel = await this.channelUseCase.removeBanner(userId);
    return ChannelTransformer.toResponse(channel, this.storage);
  }

  // ---------- публичное ----------

  @ApiOkResponse({ type: PublicChannelResponse, description: "Страница канала по username" })
  @ApiNotFoundResponse({ description: "Канала нет или он заблокирован" })
  @Get("by-username/:username")
  async getByUsername(
    @Param("username") username: string,
    @OptionalUserId() viewerId: string | null,
  ): Promise<PublicChannelResponse> {
    const live = await this.channelUseCase.getPublicChannel(username, viewerId);
    return ChannelTransformer.toPublic(live, this.storage);
  }

  @ApiOkResponse({ type: PublicChannelResponse, description: "Страница канала по id" })
  @ApiNotFoundResponse({ description: "Канала нет или он заблокирован" })
  @Get("id/:channelId")
  async getById(
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @OptionalUserId() viewerId: string | null,
  ): Promise<PublicChannelResponse> {
    const live = await this.channelUseCase.getPublicChannelById(channelId, viewerId);
    return ChannelTransformer.toPublic(live, this.storage);
  }

  @ApiOkResponse({
    type: ChatHistoryResponse,
    description: "История чата текущего эфира, старые сообщения — через before",
  })
  @ApiNotFoundResponse({ description: "Канала не существует" })
  @Get(":channelId/chat")
  async getChat(
    @Param("channelId") channelId: string,
    @Query() query: ChatHistoryQuery,
  ): Promise<ChatHistoryResponse> {
    return this.chatUseCase.loadMessages({ channelId, ...query });
  }

  @ApiOkResponse({ type: FollowResponse })
  @Post(":channelId/follow")
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async follow(
    @CurrentUserId() userId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
  ): Promise<FollowResponse> {
    return this.followUseCase.follow(userId, channelId);
  }

  @ApiOkResponse({ type: FollowResponse })
  @Delete(":channelId/follow")
  @UseGuards(SessionGuard)
  async unfollow(
    @CurrentUserId() userId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
  ): Promise<FollowResponse> {
    return this.followUseCase.unfollow(userId, channelId);
  }
}
