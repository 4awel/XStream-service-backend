import { IDataServices } from "@/core/repositories/data-service.repository";
import { EditChannelSettiengsDto } from "@/core/user/dto/user.dto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class UserUseCase {
  constructor(
    @Inject(IDataServices)
    private dataService: IDataServices,
  ) {}

  async getUserWithChannel(userId: string) {
    const user = await this.dataService.user.findByIdWithChannel(userId);

    if (!user) {
      throw new NotFoundException("getUser: User not found");
    }

    return user;
  }

  async changeUsername(userId: string, username: string): Promise<void> {
    await this.dataService.user.changeUsername(userId, username);
  }

  async changeChannelSettings(dto: EditChannelSettiengsDto): Promise<void> {
    const streamer = this.dataService.user.findByIdWithChannel(dto.streamerId);

    if (!streamer) {
      throw new NotFoundException("changeChannelSettings: Streamer not found");
    }

    await this.dataService.user.changeChannel(dto);
  }
}
