import { User as PrismaUser } from "@prisma/generated/client";
import { User } from "@/core/entity/user.entity";

export class PrismaUserMapper {
  private constructor() {
    throw new Error(
      "PrismaUserMapper: is a static class and should not be instantiated",
    );
  }
  public static toPrisma(user: User): PrismaUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      displayName: user.displayName,
      platform: user.platform,
      language: user.language,
      isEmailVerified: user.isEmailVerified,
      blocked: user.blocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      password: user.password,
    };
  }

  public static toEntity(userPrismaData: PrismaUser): User {
    return new User({
      id: userPrismaData.id,
      email: userPrismaData.email,
      username: userPrismaData.username,
      displayName: userPrismaData.displayName,
      createdAt: userPrismaData.createdAt,
      updatedAt: userPrismaData.updatedAt,
      bio: userPrismaData.bio,
      avatar: userPrismaData.avatar,
      platform: userPrismaData.platform,
      language: userPrismaData.language,
      isEmailVerified: userPrismaData.isEmailVerified,
      blocked: userPrismaData.blocked,
      password: userPrismaData.password,
    });
  }
}
