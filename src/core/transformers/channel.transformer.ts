import { Channel } from "@/core/entity/channel.entity";
import { ChannelResponse } from "@/core/user/dto/user.dto";

export class ChannelTransformer {
  constructor() {
    throw new Error("Cannot instance of static class");
  }

  public static toResponse(channel: Channel): ChannelResponse {
    return {
      id: channel.id,
      streamDescription: channel.streamDescription,
      streamTitle: channel.streamTitle,
      thumbnailUrl: channel.thumbnailUrl,
      primaryCategoryId: channel.primaryCategoryId,
      isLive: channel.isLive,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }
}
