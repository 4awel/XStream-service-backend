import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

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

  @ApiProperty({ description: "шапка канала", nullable: true, type: String })
  bannerUrl: string | null;

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
  @ApiPropertyOptional({ description: "устарело, сервер берёт id из сессии" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  oldPassword: string;

  @ApiProperty({ description: "8–128 символов, минимум одна буква и одна цифра" })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/(?=.*\p{L})(?=.*\d)/u, {
    message: "password must contain at least one letter and one digit",
  })
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
    description: "ссылка на аватар; null — показывать заглушку",
    nullable: true,
    type: String,
  })
  avatarUrl: string | null;

  @ApiProperty({ enum: ["DARK", "LIGHT"] })
  theme: "DARK" | "LIGHT";

  @ApiProperty({ description: "онбординг пройден" })
  onboardingCompleted: boolean;

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
