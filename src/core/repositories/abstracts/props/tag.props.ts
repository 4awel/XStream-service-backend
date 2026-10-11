import { TagKind } from "@prisma/generated";

export interface ListTagsQuery {
  kinds?: TagKind[];
  search?: string;
  limit: number;
}
