import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

/** Пустая строка в необязательном тексте = «очистить поле». */
const trimToNull = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: "Латиница, цифры и _, 3–24 символа. Хранится в нижнем регистре",
    example: "denis_live",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Matches(/^[a-z0-9_]{3,24}$/, {
    message: "username: 3–24 символа, латиница, цифры и _",
  })
  username?: string;

  @ApiPropertyOptional({ description: "Отображаемое имя, 1–32 символа" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  displayName?: string;

  @ApiPropertyOptional({ description: "О себе, до 300 символов; пустая строка — очистить" })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(300)
  bio?: string | null;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: ["DARK", "LIGHT"] })
  @IsOptional()
  @IsIn(["DARK", "LIGHT"])
  theme?: "DARK" | "LIGHT";
}

export class UpdateInterestsDto {
  @ApiProperty({ description: "id выбранных тегов", type: [String] })
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID("all", { each: true })
  tagIds: string[];
}

export class UpdateChannelDto {
  @ApiPropertyOptional({ description: "Название стрима, до 140 символов" })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(140)
  streamTitle?: string | null;

  @ApiPropertyOptional({ description: "Описание канала, до 1000 символов" })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(1000)
  streamDescription?: string | null;

  @ApiPropertyOptional({ description: "id категории (Tag kind=CATEGORY); пустая строка — убрать" })
  @IsOptional()
  @Transform(trimToNull)
  @IsUUID()
  primaryCategoryId?: string | null;
}

export class StreamerResponse {
  @ApiProperty() id: string;
  @ApiProperty() username: string;
  @ApiProperty() displayName: string;
  @ApiProperty({ nullable: true, type: String }) bio: string | null;
  @ApiProperty({ nullable: true, type: String }) avatarUrl: string | null;
}

export class CategoryRefResponse {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() title: string;
}

export class PublicChannelResponse {
  @ApiProperty() id: string;
  @ApiProperty() isLive: boolean;
  @ApiProperty({ nullable: true, type: String }) streamTitle: string | null;
  @ApiProperty({ nullable: true, type: String }) streamDescription: string | null;
  @ApiProperty({ nullable: true, type: String }) primaryCategoryId: string | null;
  @ApiProperty({ nullable: true, type: String }) bannerUrl: string | null;
  @ApiProperty() followersCount: number;
  @ApiProperty({ description: "Зрителей прямо сейчас" }) viewersCount: number;
  @ApiProperty({ nullable: true, type: String, description: "ISO, начало эфира" })
  liveStartedAt: string | null;
  @ApiProperty({ nullable: true, type: CategoryRefResponse })
  category: CategoryRefResponse | null;
  @ApiProperty({ description: "Подписан ли текущий пользователь; false для гостя" })
  isFollowing: boolean;
  @ApiProperty({ type: StreamerResponse }) streamer: StreamerResponse;
}

export class FollowResponse {
  @ApiProperty() isFollowing: boolean;
  @ApiProperty() followersCount: number;
}

export class TagResponse {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() title: string;
  @ApiProperty() kind: string;
  @ApiProperty({ nullable: true, type: String }) group: string | null;
  @ApiProperty() isMature: boolean;
  @ApiProperty() viewersCount: number;
}
