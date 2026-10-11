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
import type { IncomingMessage } from "node:http";
import type { RequestHandler } from "express";
import type { SessionData } from "express-session";
import { Server, Socket } from "socket.io";

import { SESSION_MIDDLEWARE } from "@/core/auth/session.module";
import {
  type ChannelRef,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
  SOCKET_EVENT,
  channelRoom,
} from "@/core/events/events";
import { IDataServices } from "@/core/repositories/data-service.repository";
import { ViewerCountService } from "@/core/viewers/viewer-count.service";

import "@/core/auth/session.types";

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  never,
  SocketData
>;
export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  never,
  SocketData
>;

type HandshakeRequest = IncomingMessage & { session?: Partial<SessionData> };

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
    private readonly viewers: ViewerCountService,
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

  /**
   * Единственная точка отправки клиентам. Use case зовёт её напрямую:
   * `events.emitToChannel(id, SOCKET_EVENT.ChatMessage, payload)` — имя события
   * и форма payload проверяются по ServerToClientEvents.
   */
  emitToChannel<E extends keyof ServerToClientEvents>(
    channelId: string,
    event: E,
    ...payload: Parameters<ServerToClientEvents[E]>
  ): void {
    this.server.to(channelRoom(channelId)).emit(event, ...payload);
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
    // Дублируем в Redis для REST: каталог и рекомендации сортируют по зрителям.
    void this.viewers.set(channelId, count).catch((error: unknown) => {
      this.logger.warn(`Не удалось записать зрителей ${channelId}: ${String(error)}`);
    });
  }

}

export const readChannelId = (body: unknown): string | null => {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { channelId } = body as { channelId?: unknown };

  return typeof channelId === "string" && channelId.length > 0
    ? channelId
    : null;
};
