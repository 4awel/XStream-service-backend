import { Tag } from "@/core/entity/tag.entity";
import { ListTagsQuery } from "@/core/repositories/abstracts/props/tag.props";

export abstract class TagRepository {
  abstract list(query: ListTagsQuery): Promise<Tag[]>;

  abstract findById(tagId: string): Promise<Tag | null>;

  abstract findBySlug(slug: string): Promise<Tag | null>;

  abstract interestWeights(userId: string): Promise<Map<string, number>>;

  abstract filterExisting(tagIds: string[]): Promise<string[]>;

  abstract replaceExplicitInterests(
    userId: string,
    tagIds: string[],
  ): Promise<void>;

  abstract listUserInterests(userId: string): Promise<Tag[]>;
}
