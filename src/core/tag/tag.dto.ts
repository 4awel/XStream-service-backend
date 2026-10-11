import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import type { TagKind } from "@prisma/generated";

export const TAG_KINDS: TagKind[] = [
  "CATEGORY",
  "GAME_MODE",
  "FORMAT",
  "MOOD",
  "LANGUAGE",
  "CONTENT",
];

export class ListTagsQueryDto {
  @ApiPropertyOptional({
    description: "Через запятую: CATEGORY,FORMAT",
    example: "CATEGORY",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",").map((kind) => kind.trim()) : value,
  )
  @IsArray()
  @IsIn(TAG_KINDS, { each: true })
  kind?: TagKind[];

  @ApiPropertyOptional({ description: "Поиск по названию" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  search?: string;

  @ApiPropertyOptional({ example: 100, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
