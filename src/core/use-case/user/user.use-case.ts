import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { Channel } from "@/core/entity/channel.entity";
import { Tag } from "@/core/entity/tag.entity";
import { User } from "@/core/entity/user.entity";
import { IDataServices } from "@/core/repositories/data-service.repository";
import type {
  UpdateProfileProps,
  UpdateSettingsProps,
} from "@/core/repositories/abstracts/props/user.props";
import { RateLimitService } from "@/core/security/rate-limit.service";
import { ImageProcessor } from "@/core/storage/image.processor";
import { IStorage } from "@/core/storage/storage.abstract";
import { RESERVED_USERNAMES } from "@/shared/constants/reserved-usernames";

const UPLOAD_LIMIT = 10;
const UPLOAD_WINDOW_SEC = 10 * 60;

export interface UserWithChannel {
  user: User;
  channel: Channel;
}

@Injectable()
export class UserUseCase {
  constructor(
    @Inject(IDataServices)
    private readonly dataService: IDataServices,
    @Inject(IStorage)
    private readonly storage: IStorage,
    private readonly images: ImageProcessor,
    private readonly rateLimit: RateLimitService,
  ) {}

  async getUserWithChannel(userId: string): Promise<UserWithChannel> {
    const user = await this.dataService.user.findByIdWithChannel(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(
    userId: string,
    props: UpdateProfileProps,
  ): Promise<UserWithChannel> {
    if (props.username !== undefined && RESERVED_USERNAMES.has(props.username)) {
      throw new BadRequestException("This username is reserved");
    }

    const updated = await this.dataService.user.updateProfile(userId, props);

    if (updated === null) {
      throw new ConflictException("Username is already taken");
    }

    return this.getUserWithChannel(userId);
  }

  async updateSettings(
    userId: string,
    props: UpdateSettingsProps,
  ): Promise<UserWithChannel> {
    await this.dataService.user.updateSettings(userId, props);
    return this.getUserWithChannel(userId);
  }

  async uploadAvatar(userId: string, file: Buffer): Promise<UserWithChannel> {
    await this.rateLimit.consume(`upload:${userId}`, UPLOAD_LIMIT, UPLOAD_WINDOW_SEC);

    const { user } = await this.getUserWithChannel(userId);
    const image = await this.images.process(file, "avatar");
    // Новый ключ на каждую загрузку: старый URL закэширован как immutable.
    const key = `avatars/${userId}/${randomUUID()}.${image.extension}`;

    await this.storage.put(key, image.body, image.contentType);
    await this.dataService.user.setAvatar(userId, key);

    // Удаляем старый файл только после того, как в базе уже новый ключ.
    if (user.avatarKey !== null) {
      await this.storage.delete(user.avatarKey);
    }

    return this.getUserWithChannel(userId);
  }

  async removeAvatar(userId: string): Promise<UserWithChannel> {
    const { user } = await this.getUserWithChannel(userId);

    if (user.avatarKey !== null) {
      await this.dataService.user.setAvatar(userId, null);
      await this.storage.delete(user.avatarKey);
    }

    return this.getUserWithChannel(userId);
  }

  listInterests(userId: string): Promise<Tag[]> {
    return this.dataService.tag.listUserInterests(userId);
  }

  /** Онбординг: сохраняет выбранные интересы и больше онбординг не показывает. */
  async saveInterests(userId: string, tagIds: string[]): Promise<Tag[]> {
    const unique = [...new Set(tagIds)];
    // Чужие и скрытые id молча отбрасываем: клиенту незачем знать, какие теги существуют.
    const existing = await this.dataService.tag.filterExisting(unique);

    await this.dataService.tag.replaceExplicitInterests(userId, existing);
    await this.dataService.user.completeOnboarding(userId);

    return this.listInterests(userId);
  }
}
