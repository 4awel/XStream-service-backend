import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsEmail, IsEmpty, IsString } from "class-validator";

export class ChannelResponse {
  @ApiProperty({
    description: "id",
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: "название стрима",
  })
  @IsString()
  @IsEmpty()
  streamTitle: string | null;

  @ApiProperty({
    description: "описане стрима",
  })
  @IsString()
  @IsEmpty()
  streamDescription: string | null;

  @ApiProperty({
    description: "обложка стрима",
  })
  @IsString()
  @IsEmpty()
  thumbnailUrl: string | null;

  @ApiProperty({
    description: "id текущенго раздеоа трансляции для католога/главной",
  })
  @IsString()
  @IsEmpty()
  primaryCategoryId: string | null;

  @ApiProperty({
    description: "запущен ли стрим",
  })
  @IsBoolean()
  isLive: boolean;

  @ApiProperty({
    description: "дата создания",
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: "дата обновления",
  })
  @IsDate()
  updatedAt: Date;
}

export class EditChannelSettiengsDto {
  @ApiProperty({
    description: "id, канала",
  })
  id: string;

  @ApiProperty({
    description: "id, стримера",
  })
  streamerId: string;

  @ApiProperty({
    description: "название стрима",
  })
  streamTitle: string;

  @ApiProperty({
    description: "описание стрмиа",
  })
  streamDescription: string;

  @ApiProperty({
    description: "ссылка на превью (изобр)",
  })
  thumbnailUrl: string;

  @ApiProperty({
    description: "категория стрима",
  })
  primaryCategoryId: string;

  @ApiProperty({
    description: "статус стрима",
  })
  isLive: boolean;

  @ApiProperty({
    description: "дата созд",
  })
  createdAt: Date;

  @ApiProperty({
    description: "дата обнавления",
  })
  updatedAt: Date;
}

export class EditPasswordResponse {
  @ApiProperty({ description: "Статус" })
  status: number;

  @ApiProperty({ description: "Сообщение" })
  @IsString()
  message: string;
}

export class StatusResponse {
  @ApiProperty({
    description: "Статус",
  })
  status: number;

  @ApiProperty({
    description: "Сообщение",
  })
  message: string;
}

export class EditPasswordDto {
  @IsString()
  id: string;

  @IsString()
  oldPassword: string;

  @IsString()
  newPassword: string;
}

export class UserResponse {
  @ApiProperty({
    description: "id пользователя",
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: "почта пользователя",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "псевдоним",
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: "лень убрать",
  })
  @IsString()
  displayName: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @ApiProperty({
    description: "биография пользователя",
  })
  @IsString()
  @IsEmpty()
  bio: string | null;

  @ApiProperty({
    description: "аватар, либо есть либо дефолт",
  })
  @IsString()
  @IsEmpty()
  avatar: string | null;

  @ApiProperty({
    description: "устройство с которого был зареган",
  })
  @IsString()
  @IsEmpty()
  platform: string | null;

  @ApiProperty({
    description: "язык пользователя",
  })
  @IsString()
  @IsEmpty()
  language: string | null;

  @ApiProperty({
    description: "верефикация эмейл",
  })
  @IsBoolean()
  isEmailVerified: boolean;

  @ApiProperty({
    description: "данные о канале",
  })
  @Type(() => ChannelResponse)
  channel: ChannelResponse;
}
