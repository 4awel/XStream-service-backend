import { Channel } from "@/core/entity/channel.entity";
import { User } from "@/core/entity/user.entity";
import type {
  CreateUserProps,
  UpdateUserProps,
} from "@/core/repositories/abstracts/props/user.props";
import { EditChannelSettiengsDto } from "@/core/user/dto/user.dto";

export abstract class UserRepository {
  abstract existsByEmail(email: string): Promise<boolean>;

  abstract create(data: CreateUserProps): Promise<User | null>;

  abstract update(user: UpdateUserProps): Promise<User>;

  abstract findById(id: string): Promise<User | null>;

  abstract findByIdWithChannel(
    userId: string,
  ): Promise<{ user: User; channel: Channel } | null>;

  abstract changeUsername(userId: string, username: string): Promise<void>;

  abstract changeChannel(dto: EditChannelSettiengsDto): Promise<Channel | null>;
}
