import { User } from "@/core/entity/user.entity";
import { UserResponse } from "@/core/user/dto/user.dto";
import { Channel } from "@/core/entity/channel.entity";
import { ChannelTransformer } from "@/core/transformers/channel.transformer";

export class UserTransformer {
  constructor() {
    throw new Error("Cannot instance of static class");
  }

  public static toResponse(user: User, channel: Channel): UserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      displayName: user.displayName,
      platform: user.platform,
      language: user.language,
      isEmailVerified: user.isEmailVerified,
      channel: ChannelTransformer.toResponse(channel),
    };
  }
}
