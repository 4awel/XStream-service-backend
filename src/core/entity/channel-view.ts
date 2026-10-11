import { Channel } from "@/core/entity/channel.entity";

/** Канал с тем, что нужно показать о нём снаружи: стример, категория, фоловеры. */
export interface ChannelView {
  channel: Channel;
  streamer: {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    /** Ключ объекта в S3, не URL. */
    avatarKey: string | null;
  };
  category: { id: string; slug: string; title: string } | null;
  /** Теги канала (без основной категории) — для рекомендаций по интересам. */
  tagIds: string[];
  followersCount: number;
}

/** Канал глазами конкретного зрителя прямо сейчас — то, что уходит в API. */
export interface LiveChannel {
  view: ChannelView;
  isFollowing: boolean;
  viewersCount: number;
}
