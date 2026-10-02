import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "@/core/prisma/prisma.service";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { PrismaEmailVerificationRepository } from "@/core/repositories/prisma-repo/prisma-email-verification.repository";
import { PrismaUserRepository } from "@/core/repositories/prisma-repo/prisma-user.repository";
import { PrismaChannelRepository } from "@/core/repositories/prisma-repo/prisma-channel.repository";

@Injectable()
export class PrismaDataServices implements IDataServices {
  user: PrismaUserRepository;
  emailVerification: PrismaEmailVerificationRepository;
  channel: PrismaChannelRepository;

  constructor(
    @Inject(PrismaService)
    private readonly prismaProvider: PrismaService,
  ) {
    this.user = new PrismaUserRepository(this.prismaProvider);
    this.emailVerification = new PrismaEmailVerificationRepository(
      this.prismaProvider,
    );
    this.channel = new PrismaChannelRepository(this.prismaProvider);
  }
}
