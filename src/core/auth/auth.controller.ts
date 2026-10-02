import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Req,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request } from "express";

import "@/core/auth/session.types";
import {
  AuthDto,
  RegisterResponse,
  VerifyEmailDto,
} from "@/core/auth/dto/auth.dto";
import { startSession } from "@/core/auth/session.util";
import { RateLimitService } from "@/core/security/rate-limit.service";
import { AuthUseCase } from "@/core/use-case/auth/auth.use-case";

@Controller("auth")
@ApiTags("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    @Inject(AuthUseCase)
    private authUseCase: AuthUseCase,
    private readonly rateLimit: RateLimitService,
  ) {}

  @ApiOkResponse({
    description:
      "Шаг 1. Отправляет код на почту. Ответ одинаков для свободной и занятой почты.",
  })
  @ApiBadRequestResponse({ description: "Невалидные email/пароль" })
  @ApiTooManyRequestsResponse({ description: "Слишком много запросов" })
  @Post("register")
  @HttpCode(HttpStatus.OK)
  async signupWithVerification(
    @Body() dto: AuthDto,
    @Req() req: Request,
  ): Promise<RegisterResponse> {
    await this.rateLimit.consume(`register:ip:${req.ip}`, 10, 15 * 60);
    const result = await this.authUseCase.signupWithVerification(
      dto.email,
      dto.password,
    );

    return { status: result.status, message: result.message };
  }

  @ApiOkResponse({
    description:
      "Шаг 2. Подтверждает код, создаёт аккаунт и открывает сессию (cookie).",
  })
  @ApiBadRequestResponse({ description: "Неверный или просроченный код" })
  @ApiTooManyRequestsResponse({ description: "Слишком много запросов" })
  @Post("verify")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: Request,
  ): Promise<RegisterResponse> {
    await this.rateLimit.consume(`verify:ip:${req.ip}`, 20, 15 * 60);

    const user = await this.authUseCase.verifyEmail(dto.email, dto.code);

    await startSession(req, user.id);

    return { status: 200, message: "Account created" };
  }
}
