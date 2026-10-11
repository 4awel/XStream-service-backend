import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";

import {
  type ChatSendInput,
  SOCKET_EVENT,
} from "@/core/events/events";
import { type AppSocket, readChannelId } from "@/core/events/events.gateway";
import { ChatUseCase } from "@/core/use-case/chat/chat.use-case";
import { StatusResponse } from "../user/dto/user.dto";

/**
 * Входящие события чата. Только транспорт: достаём данные из сокета и отдаём
 * в ChatUseCase — вся логика и ответ клиентам там.
 * Без namespace все шлюзы делят один socket.io Server с EventsGateway.
 */
@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly chatUseCase: ChatUseCase) {}

  @SubscribeMessage(SOCKET_EVENT.ChatSend)
  async handleChatSend(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() body: ChatSendInput,
  ): Promise<StatusResponse | void> {
    const { userId, username, channelId } = client.data;

    // Писать можно только в ту комнату, в которой находишься: иначе
    // достаточно было бы знать чужой channelId, чтобы писать в чужой чат.
    if (
      userId === null ||
      username === null ||
      channelId === null ||
      readChannelId(body) !== channelId
    ) {
      return {
        status: 403,
        message: "handleChatSend: forbidden",
      };
    }

    return await this.chatUseCase.sendMessage({
      userId,
      username,
      channelId,
      text: (body as { text?: unknown }).text,
    });
  }
}
