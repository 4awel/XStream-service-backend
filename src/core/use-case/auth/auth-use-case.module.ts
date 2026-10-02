import { Module } from "@nestjs/common";

import { MailModule } from "@/core/mail/mail.module";
import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { SecurityModule } from "@/core/security/security.module";
import { AuthUseCase } from "@/core/use-case/auth/auth.use-case";

@Module({
  imports: [PrismaDataServicesModule, SecurityModule, MailModule],
  providers: [AuthUseCase],
  exports: [AuthUseCase],
})
export class AuthUseCaseModule {}
