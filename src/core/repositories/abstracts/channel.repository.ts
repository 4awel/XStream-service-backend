import { Channel } from "@/core/entity/channel.entity";

export abstract class ChannelRepository {
  /** Канал стримера: у пользователя он всегда один (streamerId @unique). */
  abstract findByStreamerId(userId: string): Promise<Channel | null>;

  /** Канал по его собственному id — именно он приходит в пути публикации от MediaMTX. */
  abstract findByChannelId(channelId: string): Promise<Channel | null>;

  abstract resetStreamKey(userId: string, key: string): Promise<void>;

  /** Возвращает число затронутых строк: 0 означает «пути с таким id канала нет». */
  abstract setLive(channelId: string, isLive: boolean): Promise<number>;

  /** Приводит isLive всех каналов к списку реально вещающих сейчас. */
  abstract syncLive(liveChannelIds: string[]): Promise<void>;
}
