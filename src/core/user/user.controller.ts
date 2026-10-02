import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { type Request } from "express";
import { UserUseCase } from "@/core/use-case/user/user.use-case";
import {
    EditChannelSettiengsDto,
  EditPasswordDto,
  EditPasswordResponse,
  StatusResponse,
  UserResponse,
} from "@/core/user/dto/user.dto";
import { UserTransformer } from "@/core/transformers/user.transformers";
import { AuthUseCase } from "@/core/use-case/auth/auth.use-case";

@Controller("user")
@ApiTags("user")
export class UserController {
  constructor(
    @Inject(UserUseCase)
    private userUseCase: UserUseCase,

    @Inject(AuthUseCase)
    private authUseCase: AuthUseCase,
  ) {}

  @ApiOkResponse({
    description: "Кто я: работает по session-cookie, без повторного логина.",
  })
  @ApiUnauthorizedResponse({ description: "Нет активной сессии" })
  @Get("me")
  async getMe(@Req() req: Request): Promise<UserResponse> {
    if (!req.session?.userId) {
      throw new UnauthorizedException();
    }

    const user = await this.userUseCase.getUserWithChannel(req.session?.userId);

    return UserTransformer.toResponse(user.user, user.channel);
  }

  @ApiBadRequestResponse({
    description: `401: Unauthorized, 400: "password must be a string"`,
  })
  @ApiOkResponse({
    description: "Изменить пароль пользователя",
    type: EditPasswordResponse,
  })
  @Patch("password")
  async changeUserPassword(
    @Req() req: Request,
    @Body() dto: EditPasswordDto,
  ): Promise<EditPasswordResponse> {
    if (!req.session?.userId) {
      throw new UnauthorizedException();
    }

    await this.authUseCase.changePassword({
      userId: req.session.userId,
      oldPassword: dto.oldPassword,
      newPassword: dto.newPassword,
    });

    return { status: 200, message: "Password changed" };
  }

  @ApiOkResponse({
    description: "Изменение названия канала",
  })
  @ApiBadRequestResponse({
    description: "401: Unautorizated",
  })
  @Patch("/change/username")
  async changeUsername(
    @Req() req: Request,
    @Body() data: string,
  ): Promise<StatusResponse> {
    if (!req.session?.userId) {
      throw new UnauthorizedException();
    }

    await this.userUseCase.changeUsername(req.session.userId, data);

    return { status: 200, message: "Username changed" };
  }

  @ApiBadRequestResponse({
    description: "401: Unauthorized"
  })
  async changeChannelSettings(
    @Req() req: Request,
    @Body() dto: EditChannelSettiengsDto
  ): Promise<StatusResponse> {
    if (!req.session?.userId) {
        throw new UnauthorizedException();
    }

    await this.userUseCase.changeChannelSettings(dto);

    return { status: 200, message: "Channel changed" }
  }
}
