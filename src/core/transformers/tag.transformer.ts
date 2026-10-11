import { Tag } from "@/core/entity/tag.entity";
import { TagResponse } from "@/core/user/dto/profile.dto";

export class TagTransformer {
  constructor() {
    throw new Error("Cannot instance of static class");
  }

  public static toResponse(tag: Tag): TagResponse {
    return {
      id: tag.id,
      slug: tag.slug,
      title: tag.title,
      kind: tag.kind,
      group: tag.group,
      isMature: tag.isMature,
      viewersCount: tag.viewersCount,
    };
  }
}
