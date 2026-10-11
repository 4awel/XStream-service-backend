import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "@/core/prisma/prisma.service";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { PrismaEmailVerificationRepository } from "@/core/repositories/prisma-repo/prisma-email-verification.repository";
import { PrismaUserRepository } from "@/core/repositories/prisma-repo/prisma-user.repository";
import { PrismaFollowRepository } from "@/core/repositories/prisma-repo/prisma-follow.repository";
import { PrismaTagRepository } from "@/core/repositories/prisma-repo/prisma-tag.repository";
import { PrismaChatRepository } from "@/core/repositories/prisma-repo/prisma-chat.repository";
import { PrismaChannelRepository } from "@/core/repositories/prisma-repo/prisma-channel.repository";

@Injectable()
export class PrismaDataServices implements IDataServices {
  user: PrismaUserRepository;
  emailVerification: PrismaEmailVerificationRepository;
  channel: PrismaChannelRepository;
  chat: PrismaChatRepository;
  follow: PrismaFollowRepository;
  tag: PrismaTagRepository;

  constructor(
    @Inject(PrismaService)
    private readonly prismaProvider: PrismaService,
  ) {
    this.user = new PrismaUserRepository(this.prismaProvider);
    this.emailVerification = new PrismaEmailVerificationRepository(
      this.prismaProvider,
    );
    this.channel = new PrismaChannelRepository(this.prismaProvider);
    this.chat = new PrismaChatRepository(this.prismaProvider);
    this.follow = new PrismaFollowRepository(this.prismaProvider);
    this.tag = new PrismaTagRepository(this.prismaProvider);
  }
}
