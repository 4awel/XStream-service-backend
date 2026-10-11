import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { SOCKET_EVENT } from "@/core/events/events";
import { EventsGateway } from "@/core/events/events.gateway";
import { RateLimitService } from "@/core/security/rate-limit.service";
import { SendChatMessageInput } from "@/core/use-case/chat/types/chat.use-case.types";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { StatusResponse } from "@/core/user/dto/user.dto";

const MAX_TEXT_LENGTH = 500;
const CHAT_LIMIT = 10;
const CHAT_WINDOW_SEC = 10;

@Injectable()
export class ChatUseCase {
  private readonly logger = new Logger(ChatUseCase.name);

  constructor(
    private readonly events: EventsGateway,
    private readonly rateLimit: RateLimitService,
    @Inject(IDataServices)
    private readonly dataService: IDataServices,
  ) {}

  async sendMessage(input: SendChatMessageInput): Promise<StatusResponse | void> {
    const text =
      typeof input.text === "string"
        ? input.text.trim().slice(0, MAX_TEXT_LENGTH)
        : "";

    if (text.length === 0) {
      return {
        status: 400,
        message: "sendMessage: text is empty",
      };
    }

    const isAllowed = await this.rateLimit.tryConsume(
      `chat:${input.userId}`,
      CHAT_LIMIT,
      CHAT_WINDOW_SEC,
    );

    if (!isAllowed) {
      // Клиенту ответить нечем: контракт не предусматривает события ошибки.
      this.logger.warn(`Чат: лимит исчерпан, пользователь ${input.userId}`);
      return {
        status: 429,
        message: "sendMessage: rate limit exceeded",
      };
    }

    const channel = await this.dataService.channel.findByChannelId(input.channelId);

    if (!channel) {
      throw new NotFoundException("sendMessage: channel not found");
    }

    const user = await this.dataService.user.findById(input.userId);

    if (!user) {
      throw new NotFoundException("sendMessage: user not found");
    }

    if (!user.blocked && !channel.blocked) {
      return {
        status: 403,
        message: "sendMessage: user or channel is blocked",
      };
    }

    await this.dataService.chat.createMessage({
      userId: input.userId,
      channelId: input.channelId,
      text,
    });

    this.events.emitToChannel(input.channelId, SOCKET_EVENT.ChatMessage, {
      id: randomUUID(),
      channelId: input.channelId,
      userId: input.userId,
      username: input.username,
      text,
      createdAt: new Date().toISOString(),
    });
  }
}
