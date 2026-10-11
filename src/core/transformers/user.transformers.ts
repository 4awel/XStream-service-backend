import { Channel } from "@/core/entity/channel.entity";
import { User } from "@/core/entity/user.entity";
import { IStorage } from "@/core/storage/storage.abstract";
import { ChannelTransformer } from "@/core/transformers/channel.transformer";
import { UserResponse } from "@/core/user/dto/user.dto";

export class UserTransformer {
  constructor() {
    throw new Error("Cannot instance of static class");
  }

  public static toResponse(
    user: User,
    channel: Channel,
    storage: IStorage,
  ): UserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: storage.publicUrl(user.avatarKey),
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      displayName: user.displayName,
      platform: user.platform,
      language: user.language,
      isEmailVerified: user.isEmailVerified,
      theme: user.theme,
      onboardingCompleted: user.onboardingCompleted,
      channel: ChannelTransformer.toResponse(channel, storage),
    };
  }
}
