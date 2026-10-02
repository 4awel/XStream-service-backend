import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request, Response } from "express";

import { LoginDto } from "@/core/auth/dto/login.dto";
import { sessionCookieOptions } from "@/core/auth/session-cookie";
import { destroySession, startSession } from "@/core/auth/session.util";
import { RateLimitService } from "@/core/security/rate-limit.service";
import { StatusResponse } from "@/core/user/dto/user.dto";
import { AuthUseCase } from "@/core/use-case/auth/auth.use-case";

import "@/core/auth/session.types";

@Controller("auth")
@ApiTags("auth")
export class LoginController {
  constructor(
    @Inject(AuthUseCase)
    private readonly authUseCase: AuthUseCase,
    private readonly rateLimit: RateLimitService,
    private readonly config: ConfigService,
  ) {}

  @ApiOkResponse({
    type: StatusResponse,
    description: "Проверяет пароль и открывает сессию (cookie)",
  })
  @ApiUnauthorizedResponse({
    description: "Неверный email или пароль (одно сообщение на оба случая)",
  })
  @ApiForbiddenResponse({ description: "Аккаунт заблокирован" })
  @ApiTooManyRequestsResponse({ description: "Слишком много попыток входа" })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<StatusResponse> {
    await this.rateLimit.consume(`login:ip:${req.ip}`, 20, 15 * 60);

    const user = await this.authUseCase.login(dto);

    await startSession(req, user.id);

    return { status: 200, message: "success login" };
  }

  @ApiOkResponse({
    type: StatusResponse,
    description: "Закрывает сессию и удаляет cookie. Повторный вызов тоже 200",
  })
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StatusResponse> {

    await destroySession(req);

    res.clearCookie(
      this.config.getOrThrow<string>("SESSION_NAME"),
      sessionCookieOptions(this.config),
    );

    return { status: 200, message: "success logout" };
  }
}
