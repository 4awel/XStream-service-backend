import { Injectable } from "@nestjs/common";

import { Tag } from "@/core/entity/tag.entity";
import { PrismaService } from "@/core/prisma/prisma.service";
import {
  ListTagsQuery,
  TagRepository,
} from "@/core/repositories/abstracts/tag.repository";
import type { Tag as PrismaTag } from "@prisma/generated";

const toTag = (row: PrismaTag): Tag =>
  new Tag({
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    group: row.group,
    isMature: row.isMature,
    isVisible: row.isVisible,
    externalId: row.externalId,
    viewersCount: row.viewersCount,
  });

@Injectable()
export class PrismaTagRepository extends TagRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(query: ListTagsQuery): Promise<Tag[]> {
    const rows = await this.prisma.tag.findMany({
      where: {
        isVisible: true,
        kind: query.kinds ? { in: query.kinds } : undefined,
        title: query.search
          ? { contains: query.search, mode: "insensitive" }
          : undefined,
      },
      orderBy: [{ viewersCount: "desc" }, { title: "asc" }],
      take: query.limit,
    });
    return rows.map(toTag);
  }

  async findById(tagId: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { id: tagId } });
    return row ? toTag(row) : null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { slug } });
    return row ? toTag(row) : null;
  }

  async interestWeights(userId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.userTagInterest.findMany({
      where: { userId },
      select: { tagId: true, weight: true },
    });
    return new Map(rows.map(({ tagId, weight }) => [tagId, weight]));
  }

  async filterExisting(tagIds: string[]): Promise<string[]> {
    if (tagIds.length === 0) return [];

    const rows = await this.prisma.tag.findMany({
      where: { id: { in: tagIds }, isVisible: true },
      select: { id: true },
    });
    return rows.map(({ id }) => id);
  }

  async replaceExplicitInterests(
    userId: string,
    tagIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userTagInterest.deleteMany({
        where: { userId, source: "EXPLICIT" },
      }),
      // skipDuplicates: если тег уже есть как IMPLICIT, оставляем ту запись.
      this.prisma.userTagInterest.createMany({
        data: tagIds.map((tagId) => ({ userId, tagId, source: "EXPLICIT" })),
        skipDuplicates: true,
      }),
    ]);
  }

  async listUserInterests(userId: string): Promise<Tag[]> {
    const rows = await this.prisma.userTagInterest.findMany({
      where: { userId },
      include: { tag: true },
      orderBy: { weight: "desc" },
    });
    return rows.map((row) => toTag(row.tag));
  }
}
