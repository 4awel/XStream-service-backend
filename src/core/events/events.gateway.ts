import { Inject, Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { RequestHandler } from "express";
import type { SessionData } from "express-session";
import { Server, Socket } from "socket.io";

import { SESSION_MIDDLEWARE } from "@/core/auth/session.module";
import {
  type ChannelRef,
  type ChatSendInput,
  type ClientToServerEvents,
  type FollowPayload,
  type ServerToClientEvents,
  type SocketData,
  SOCKET_EVENT,
  channelRoom,
  type SubscriptionPayload,
} from "@/core/events/events";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { RateLimitService } from "@/core/security/rate-limit.service";

import "@/core/auth/session.types";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

type HandshakeRequest = IncomingMessage & { session?: Partial<SessionData> };

const MAX_TEXT_LENGTH = 500;
const CHAT_LIMIT = 10;
const CHAT_WINDOW_SEC = 10;

@WebSocketGateway({
  cors: {
    // ConfigService в декоратор не передать — он вычисляется при импорте модуля,
    // до создания DI-контейнера. dotenv к этому моменту уже загружен в main.ts.
    origin: (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit<AppServer>, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  private server!: AppServer;

  constructor(
    @Inject(SESSION_MIDDLEWARE)
    private readonly sessionMiddleware: RequestHandler,
    @Inject(IDataServices)
    private readonly dataService: IDataServices,
    private readonly rateLimit: RateLimitService,
  ) {}

  afterInit(server: AppServer): void {
    server.engine.use(this.sessionMiddleware);
  }

  async handleConnection(client: AppSocket): Promise<void> {
    client.data.userId = null;
    client.data.username = null;
    client.data.channelId = null;

    const userId = (client.request as HandshakeRequest).session?.userId;

    if (userId === undefined) {
      return;
    }

    const user = await this.dataService.user.findById(userId);

    if (user === null) {
      // Сессия ссылается на удалённого пользователя — считаем анонимом.
      return;
    }

    client.data.userId = user.id;
    client.data.username = user.username;
  }

  handleDisconnect(client: AppSocket): void {
    const { channelId } = client.data;

    // К этому моменту socket.io уже убрал соединение из комнат,
    // поэтому размер комнаты актуален и остаётся только разослать его.
    if (channelId !== null) {
      this.broadcastViewers(channelId);
    }
  }

  @SubscribeMessage(SOCKET_EVENT.JoinChannel)
  async handleJoinChannel(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() body: ChannelRef,
  ): Promise<void> {
    const channelId = readChannelId(body);

    if (channelId === null) {
      return;
    }

    const channel = await this.dataService.channel.findByChannelId(channelId);

    if (channel === null || channel.blocked) {
      this.logger.warn(`Заход в недоступный канал ${channelId}`);
      return;
    }

    // Фронт держит одну комнату, но на реконнекте мог не успеть выйти из старой.
    await this.leaveCurrentChannel(client);

    await client.join(channelRoom(channelId));
    client.data.channelId = channelId;

    this.broadcastViewers(channelId);
  }

  @SubscribeMessage(SOCKET_EVENT.LeaveChannel)
  async handleLeaveChannel(
    @ConnectedSocket() client: AppSocket,
  ): Promise<void> {
    // channelId из тела не читаем: выходить можно только из своей комнаты,
    // и шлюз помнит её сам.
    await this.leaveCurrentChannel(client);
  }

  @SubscribeMessage(SOCKET_EVENT.ChatSend)
  async handleChatSend(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() body: ChatSendInput,
  ): Promise<void> {
    const { userId, username, channelId } = client.data;

    if (userId === null || username === null) {
      return;
    }

    // Писать можно только в ту комнату, в которой находишься: иначе
    // достаточно было бы знать чужой channelId, чтобы писать в чужой чат.
    if (channelId === null || readChannelId(body) !== channelId) {
      return;
    }

    const text = readText(body);

    if (text === null) {
      return;
    }

    const isAllowed = await this.rateLimit.tryConsume(
      `chat:${userId}`,
      CHAT_LIMIT,
      CHAT_WINDOW_SEC,
    );

    if (!isAllowed) {
      // Клиенту ответить нечем: контракт не предусматривает события ошибки.
      this.logger.warn(`Чат: лимит исчерпан, пользователь ${userId}`);
      return;
    }

    // Сообщения нигде не хранятся — в схеме Prisma нет таблицы чата.
    // Клиент держит последние 200 в памяти, при перезагрузке чат пуст.
    this.server.to(channelRoom(channelId)).emit(SOCKET_EVENT.ChatMessage, {
      id: randomUUID(),
      channelId,
      userId,
      username,
      text,
      createdAt: new Date().toISOString(),
    });
  }

  /** Для будущей ручки подписки на канал. */
  emitFollow(payload: FollowPayload): void {
    this.server
      .to(channelRoom(payload.channelId))
      .emit(SOCKET_EVENT.Follow, payload);
  }

  /** Для будущей ручки оформления подписки. */
  emitSubscription(payload: SubscriptionPayload): void {
    this.server
      .to(channelRoom(payload.channelId))
      .emit(SOCKET_EVENT.Subscription, payload);
  }

  private async leaveCurrentChannel(client: AppSocket): Promise<void> {
    const { channelId } = client.data;

    if (channelId === null) {
      return;
    }

    await client.leave(channelRoom(channelId));
    client.data.channelId = null;

    this.broadcastViewers(channelId);
  }

  /**
   * Считаем размер комнаты локально. На одном процессе это точно; при
   * нескольких репликах понадобится socket.io-redis-adapter, иначе каждая
   * будет видеть только своих зрителей.
   */
  private broadcastViewers(channelId: string): void {
    const room = channelRoom(channelId);
    const count = this.server.sockets.adapter.rooms.get(room)?.size ?? 0;

    this.server.to(room).emit(SOCKET_EVENT.ViewersCount, { channelId, count });
  }
}

const readChannelId = (body: unknown): string | null => {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { channelId } = body as { channelId?: unknown };

  return typeof channelId === "string" && channelId.length > 0
    ? channelId
    : null;
};

const readText = (body: unknown): string | null => {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { text } = body as { text?: unknown };

  if (typeof text !== "string") {
    return null;
  }

  // Обрезаем на сервере независимо от клиента: он ограничение соблюдает,
  // но полагаться на это нельзя.
  const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);

  return trimmed.length > 0 ? trimmed : null;
};
