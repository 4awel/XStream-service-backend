import type { ChatMessagePayload } from "@/core/events/events";

export interface SendChatMessageInput {
  userId: string;
  username: string;
  channelId: string;
  text: unknown;
}

export interface LoadChatInput {
  channelId: string;
  before?: string;
  limit?: number;
}

export interface ChatHistory {
  items: ChatMessagePayload[];
  hasMore: boolean;
}
