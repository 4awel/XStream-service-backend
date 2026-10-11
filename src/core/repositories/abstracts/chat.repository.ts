import { ChatMessage } from "@/core/entity/chat.entity";
import { CreateMessageProps } from "@/core/repositories/abstracts/props/chat.props";

export abstract class ChatRepository {
  abstract createMessage(input: CreateMessageProps): Promise<ChatMessage>;
  
  abstract loadMessages(
    channelId: string,
    limit: number,
    before?: string,
  ): Promise<ChatMessage[]>;

  abstract deleteByChannelIds(channelIds: string[]): Promise<void>;
}
