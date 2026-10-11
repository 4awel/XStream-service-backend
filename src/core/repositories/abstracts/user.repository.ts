import { Channel } from "@/core/entity/channel.entity";
import { User } from "@/core/entity/user.entity";
import type {
  CreateUserProps,
  UpdateProfileProps,
  UpdateSettingsProps,
  UpdateUserProps,
} from "@/core/repositories/abstracts/props/user.props";

export abstract class UserRepository {
  abstract existsByEmail(email: string): Promise<boolean>;

  abstract create(data: CreateUserProps): Promise<User | null>;

  abstract update(user: UpdateUserProps): Promise<User>;

  abstract findById(id: string): Promise<User | null>;

  /** Нужен для входа: email — то, чем пользователь себя называет. */
  abstract findByEmail(email: string): Promise<User | null>;

  abstract findByIdWithChannel(
    userId: string,
  ): Promise<{ user: User; channel: Channel } | null>;

  abstract findByUsername(username: string): Promise<User | null>;

  /** null — username уже занят (уникальный индекс), остальное бросается. */
  abstract updateProfile(
    userId: string,
    props: UpdateProfileProps,
  ): Promise<User | null>;

  abstract updateSettings(
    userId: string,
    props: UpdateSettingsProps,
  ): Promise<User>;

  /** Ключ объекта в S3 или null — убрать аватар. */
  abstract setAvatar(userId: string, avatarKey: string | null): Promise<void>;

  abstract completeOnboarding(userId: string): Promise<void>;
}
