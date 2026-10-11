import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { CurrentUserId } from "@/core/auth/decorator/current-user-id.decorator";
import { SessionGuard } from "@/core/auth/guards/session.guard";
import { IStorage } from "@/core/storage/storage.abstract";
import { ChannelTransformer } from "@/core/transformers/channel.transformer";
import { TagTransformer } from "@/core/transformers/tag.transformer";
import { UserTransformer } from "@/core/transformers/user.transformers";
import { AuthUseCase } from "@/core/use-case/auth/auth.use-case";
import { FollowUseCase } from "@/core/use-case/follow/follow.use-case";
import {
  UserUseCase,
  type UserWithChannel,
} from "@/core/use-case/user/user.use-case";
import {
  PublicChannelResponse,
  TagResponse,
  UpdateInterestsDto,
  UpdateProfileDto,
  UpdateSettingsDto,
} from "@/core/user/dto/profile.dto";
import {
  EditPasswordDto,
  EditPasswordResponse,
  UserResponse,
} from "@/core/user/dto/user.dto";
import { imageUploadOptions, requireFile } from "@/core/user/upload.pipe";

const FILE_BODY = {
  schema: {
    type: "object",
    properties: { file: { type: "string", format: "binary" } },
  },
};

@Controller("user")
@ApiTags("user")
@ApiCookieAuth()
@UseGuards(SessionGuard)
@ApiUnauthorizedResponse({ description: "Нет активной сессии" })
export class UserController {
  constructor(
    @Inject(UserUseCase) private readonly userUseCase: UserUseCase,
    @Inject(AuthUseCase) private readonly authUseCase: AuthUseCase,
    @Inject(FollowUseCase) private readonly followUseCase: FollowUseCase,
    @Inject(IStorage) private readonly storage: IStorage,
  ) {}

  @ApiOkResponse({ type: UserResponse, description: "Текущий пользователь" })
  @Get("me")
  async getMe(@CurrentUserId() userId: string): Promise<UserResponse> {
    return this.toResponse(await this.userUseCase.getUserWithChannel(userId));
  }

  @ApiOkResponse({ type: UserResponse })
  @ApiConflictResponse({ description: "username занят" })
  @ApiBadRequestResponse({ description: "Невалидные поля или зарезервированный username" })
  @Patch("profile")
  async updateProfile(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponse> {
    return this.toResponse(await this.userUseCase.updateProfile(userId, dto));
  }

  @ApiOkResponse({ type: UserResponse, description: "Тема и прочие настройки интерфейса" })
  @Patch("settings")
  async updateSettings(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateSettingsDto,
  ): Promise<UserResponse> {
    return this.toResponse(await this.userUseCase.updateSettings(userId, dto));
  }

  @ApiOkResponse({ type: EditPasswordResponse })
  @Patch("password")
  async changeUserPassword(
    @CurrentUserId() userId: string,
    @Body() dto: EditPasswordDto,
  ): Promise<EditPasswordResponse> {
    await this.authUseCase.changePassword({
      userId,
      oldPassword: dto.oldPassword,
      newPassword: dto.newPassword,
    });

    return { status: 200, message: "Password changed" };
  }

  @ApiOkResponse({ type: UserResponse })
  @ApiConsumes("multipart/form-data")
  @ApiBody(FILE_BODY)
  @ApiTooManyRequestsResponse({ description: "Не больше 10 загрузок за 10 минут" })
  @Post("avatar")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("file", imageUploadOptions))
  async uploadAvatar(
    @CurrentUserId() userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UserResponse> {
    return this.toResponse(
      await this.userUseCase.uploadAvatar(userId, requireFile(file)),
    );
  }

  @ApiOkResponse({ type: UserResponse })
  @Delete("avatar")
  async removeAvatar(@CurrentUserId() userId: string): Promise<UserResponse> {
    return this.toResponse(await this.userUseCase.removeAvatar(userId));
  }

  @ApiOkResponse({ type: [TagResponse], description: "Интересы пользователя" })
  @Get("interests")
  async getInterests(@CurrentUserId() userId: string): Promise<TagResponse[]> {
    const tags = await this.userUseCase.listInterests(userId);
    return tags.map(TagTransformer.toResponse);
  }

  @ApiOkResponse({
    type: [TagResponse],
    description: "Сохраняет выбранные интересы и отмечает онбординг пройденным",
  })
  @Put("interests")
  async saveInterests(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateInterestsDto,
  ): Promise<TagResponse[]> {
    const tags = await this.userUseCase.saveInterests(userId, dto.tagIds);
    return tags.map(TagTransformer.toResponse);
  }

  @ApiOkResponse({
    type: [PublicChannelResponse],
    description: "Каналы, на которые подписан пользователь; в эфире — первыми",
  })
  @Get("follows")
  async getFollows(
    @CurrentUserId() userId: string,
  ): Promise<PublicChannelResponse[]> {
    const channels = await this.followUseCase.listFollowed(userId);
    return channels.map((live) => ChannelTransformer.toPublic(live, this.storage));
  }

  private toResponse({ user, channel }: UserWithChannel): UserResponse {
    return UserTransformer.toResponse(user, channel, this.storage);
  }
}
