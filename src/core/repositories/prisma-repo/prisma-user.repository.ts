import { Injectable } from "@nestjs/common";
import { User } from "@/core/entity/user.entity";
import { PrismaService } from "@/core/prisma/prisma.service";
import { UserRepository } from "@/core/repositories/abstracts/user.repository";
import { PrismaUserMapper } from "@/core/mappers/user.mapper";
import {
  CreateUserProps,
  UpdateUserProps,
} from "@/core/repositories/abstracts/props/user.props";
import { Channel } from "@/core/entity/channel.entity";
import { PrismaChannelMapper } from "@/core/mappers/channel.mapper";
import { EditChannelSettiengsDto } from "@/core/user/dto/user.dto";

const UNIQUE_VIOLATION = "P2002";

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async create(data: CreateUserProps): Promise<User | null> {
    try {
      const row = await this.prisma.user.create({
        data: {
          ...data,
          channel: { create: {} },
        },
        include: {
          channel: true,
        },
      });
      return new User(row);
    } catch (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        return null;
      }
      throw error;
    }
  }

  async update(dataUser: UpdateUserProps): Promise<User> {
    const user = await this.findById(dataUser.id);

    if (!user) {
      throw new Error("updateUser: User not found");
    }

    const updateUser = await this.prisma.user.update({
      where: {
        id: dataUser.id,
      },
      data: {
        // только переданные поля; undefined Prisma игнорирует
        email: dataUser.email,
        password: dataUser.passwordHash,
      },
    });

    return PrismaUserMapper.toEntity(updateUser);
  }

  async changeUsername(userId: string, username: string): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error("updateUser: User not found");
    }

    (await this,
      this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          username: username,
        },
      }));
  }

  async findById(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user) return null;

    return PrismaUserMapper.toEntity(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return PrismaUserMapper.toEntity(user);
  }

  async findByIdWithChannel(
    userId: string,
  ): Promise<{ user: User; channel: Channel } | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { channel: true },
    });
    if (!raw) return null;

    if (!raw.channel) {
      throw new Error(`Данные повреждены: у пользователя ${userId} нет канала`);
    }

    return {
      user: PrismaUserMapper.toEntity(raw),
      channel: PrismaChannelMapper.toEntity(raw.channel),
    };
  }

  async changeChannel(data: EditChannelSettiengsDto): Promise<Channel | null> {
    if (!data || !data.id) {
      return null;
    }

    const updatedChannel = await this.prisma.channel.update({
      where: {
        id: data.id,
      },
      data: {
        streamTitle: data.streamTitle,
        streamDescription: data.streamDescription,
        thumbnailUrl: data.thumbnailUrl,
        primaryCategoryId: data.primaryCategoryId,
        updatedAt: Date.now().toString(),
      },
    });

    return PrismaChannelMapper.toEntity(updatedChannel);
  }
}
