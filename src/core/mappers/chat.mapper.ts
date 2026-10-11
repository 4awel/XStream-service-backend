import { ChatMessage } from "@/core/entity/chat.entity";
import { ChatMessages } from "@prisma/generated";

export type ChatMessageWithUser = ChatMessages & { user: { username: string } };

export class PrismaChatMapper {
  constructor() {
    throw new Error(
      "PrismaChatMapper is a static class and cannot be instantiated.",
    );
  }

  static toEntity(prismaMessage: ChatMessageWithUser): ChatMessage {
    return new ChatMessage({
      id: prismaMessage.id,
      userId: prismaMessage.userId,
      username: prismaMessage.user.username,
      channelId: prismaMessage.channelId,
      text: prismaMessage.content,
      createdAt: prismaMessage.createdAt,
    });
  }
}
