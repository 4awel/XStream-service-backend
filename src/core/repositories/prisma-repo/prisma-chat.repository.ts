import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import { ChatRepository } from "@/core/repositories/abstracts/chat.repository";
import { CreateMessageProps } from "@/core/repositories/abstracts/props/chat.props";
import { ChatMessage } from "@/core/entity/chat.entity";
import { PrismaChatMapper } from "@/core/mappers/chat.mapper";

const WITH_USER = { user: { select: { username: true } } } as const;

@Injectable()
export class PrismaChatRepository extends ChatRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createMessage(input: CreateMessageProps): Promise<ChatMessage> {
    const message = await this.prisma.chatMessages.create({
      data: {
        userId: input.userId,
        channelId: input.channelId,
        content: input.text,
      },
      include: WITH_USER,
    });

    return PrismaChatMapper.toEntity(message);
  }

  async loadMessages(
    channelId: string,
    limit: number,
    before?: string,
  ): Promise<ChatMessage[]> {
    // id — uuid v7, он растёт со временем, поэтому служит и сортировкой, и курсором.
    const messages = await this.prisma.chatMessages.findMany({
      where: { channelId, ...(before ? { id: { lt: before } } : {}) },
      orderBy: { id: "desc" },
      take: limit,
      include: WITH_USER,
    });

    return messages.reverse().map((msg) => PrismaChatMapper.toEntity(msg));
  }

  async deleteByChannelIds(channelIds: string[]): Promise<void> {
    if (channelIds.length === 0) return;

    await this.prisma.chatMessages.deleteMany({
      where: { channelId: { in: channelIds } },
    });
  }
}
