import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";

import { User } from "@/core/entity/user.entity";
import { MailService } from "@/core/mail/mail.service";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { PasswordService } from "@/core/security/password.service";
import { RateLimitService } from "@/core/security/rate-limit.service";
import { VerificationCodeService } from "@/core/security/verification-code.service";
import { ChangePasswordDto, StatusMessage } from "@/core/use-case/auth/index";
import { LoginDto } from "@/core/auth/dto/login.dto";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 60;
const USERNAME_RETRIES = 5;

// один и тот же ответ для нового и уже занятого email — не даём перебирать почты
const REGISTER_MESSAGE =
  "If this email can be registered, a verification code has been sent";
const INVALID_CODE_MESSAGE = "Invalid or expired verification code";
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

@Injectable()
export class AuthUseCase {
  private readonly logger = new Logger("AuthUseCase");
  constructor(
    @Inject(IDataServices)
    private dataService: IDataServices,
    @Inject(MailService)
    private readonly mail: MailService,
    private readonly passwords: PasswordService,
    private readonly codes: VerificationCodeService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async signupWithVerification(
    email: string,
    password: string,
  ): Promise<StatusMessage> {
    // кулдаун на email до любых проверок, чтобы 429 не выдавал, занят ли email
    await this.rateLimit.consume(
      `register:email:${email}`,
      1,
      RESEND_COOLDOWN_SEC,
    );
    // хэшируем всегда, чтобы время ответа не зависело от существования аккаунта
    const hashPassword = await this.passwords.hash(password);

    if (await this.dataService.user.existsByEmail(email)) {
      this.logger.log("Registration attempt for an existing account");
      return { status: 200, message: REGISTER_MESSAGE };
    }

    const code = this.codes.generate();
    await this.dataService.emailVerification.upsert(
      email,
      hashPassword,
      this.codes.hash(email, code),
      new Date(Date.now() + CODE_TTL_MS),
    );
    try {
      await this.mail.sendVerificationCode(email, code);
    } catch (error) {
      // письмо не ушло — код в базе уже бесполезен, иначе он займёт email до истечения TTL
      await this.dataService.emailVerification.remove(email);
      this.logger.error(
        `Failed to send verification code: ${(error as Error).message}`,
      );
      // кулдаун намеренно не сбрасываем: сбой почты не должен снимать защиту от перебора
      throw new ServiceUnavailableException(
        "Could not send the verification email, please try again later",
      );
    }

    return { status: 200, message: REGISTER_MESSAGE };
  }

  async verifyEmail(email: string, code: string): Promise<User> {
    const verification = await this.dataService.emailVerification.find(email);

    if (!verification) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }
    if (verification.isExpired) {
      await this.dataService.emailVerification.remove(email);
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    if (!this.codes.verify(email, code, verification.codeHash)) {
      const attempts =
        await this.dataService.emailVerification.incrementAttempts(email);
      if (attempts >= MAX_CODE_ATTEMPTS) {
        await this.dataService.emailVerification.remove(email);
      }
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    const consumed = await this.dataService.emailVerification.remove(email);
    if (!consumed) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    for (let i = 0; i < USERNAME_RETRIES; i++) {
      const username = this.generateUsername(email);
      const user = await this.dataService.user.create({
        email,
        password: verification.hashPassword,
        username,
        displayName: username,
      });
      if (user) {
        return user;
      }
      if (await this.dataService.user.existsByEmail(email)) {
        throw new ConflictException("Registration failed");
      }
    }
    throw new ConflictException("Registration failed");
  }

  async changePassword(dto: ChangePasswordDto): Promise<User> {
    const user = await this.dataService.user.findById(dto.userId);

    if (!user) {
      throw new NotFoundException("changePassword: User not found");
    }

    const compare = await this.passwords.verify(dto.oldPassword, user.password);

    if (!compare) {
      throw new ForbiddenException("changePassword: 403, password incorrect");
    }

    const newHashPassword = await this.passwords.hash(dto.newPassword);

    await this.dataService.user.update({
      id: dto.userId,
      passwordHash: newHashPassword,
    });

    return user;
  }

  async login(dto: LoginDto): Promise<User> {
    await this.rateLimit.consume(`login:email:${dto.email}`, 10, 15 * 60);

    const user = await this.dataService.user.findByEmail(dto.email);
    const isPasswordValid = await this.passwords.verify(
      dto.password,
      user?.password ?? this.passwords.dummyHash,
    );

    if (!user || !isPasswordValid) {
      this.logger.log("Failed login attempt");
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (user.blocked) {
      throw new ForbiddenException("Account is blocked");
    }

    return user;
  }

  private generateUsername(email: string): string {
    const local = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);
    return `${local || "user"}_${randomBytes(3).toString("hex")}`;
  }
}
