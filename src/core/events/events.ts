/**
 * Контракт websocket. Обязан совпадать с фронтовым lib/socket/socket.events.ts
 * и models/realtime.ts — имена событий там зашиты строками, так что
 * переименование здесь молча оставит клиента без событий.
 */

export const SOCKET_EVENT = {
  // сервер → клиент
  ChatMessage: "chat_message",
  Follow: "follow",
  Subscription: "subscription",
  ViewersCount: "viewers_count",

  // клиент → сервер
  JoinChannel: "join_channel",
  LeaveChannel: "leave_channel",
  ChatSend: "chat_send",
} as const;

export interface ChatMessagePayload {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  text: string;
  /** ISO-строка: на фронте это поле типизировано как string. */
  createdAt: string;
}

export interface FollowPayload {
  channelId: string;
  userId: string;
  username: string;
  followersCount: number;
}

export interface SubscriptionPayload {
  channelId: string;
  userId: string;
  username: string;
  months: number;
}

export interface ViewersCountPayload {
  channelId: string;
  count: number;
}

export interface ServerToClientEvents {
  [SOCKET_EVENT.ChatMessage]: (data: ChatMessagePayload) => void;
  [SOCKET_EVENT.Follow]: (data: FollowPayload) => void;
  [SOCKET_EVENT.Subscription]: (data: SubscriptionPayload) => void;
  [SOCKET_EVENT.ViewersCount]: (data: ViewersCountPayload) => void;
}

export interface ChannelRef {
  channelId: string;
}

export interface ChatSendInput extends ChannelRef {
  text: string;
}

export interface ClientToServerEvents {
  [SOCKET_EVENT.JoinChannel]: (data: ChannelRef) => void;
  [SOCKET_EVENT.LeaveChannel]: (data: ChannelRef) => void;
  [SOCKET_EVENT.ChatSend]: (data: ChatSendInput) => void;
}

/**
 * Данные, которые шлюз держит на самом соединении.
 * userId и username заполняются один раз при подключении, чтобы не ходить
 * в базу на каждое сообщение чата.
 */
export interface SocketData {
  userId: string | null;
  username: string | null;
  /** Комната, в которой сейчас находится клиент. Фронт держит максимум одну. */
  channelId: string | null;
}

/** Комнаты именуем с префиксом, чтобы не столкнуться с id самих сокетов. */
export const channelRoom = (channelId: string): string =>
  `channel:${channelId}`;
