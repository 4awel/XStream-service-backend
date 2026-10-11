import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

import { PublicChannelResponse, TagResponse } from "@/core/user/dto/profile.dto";

export class LimitQueryDto {
  @ApiPropertyOptional({ example: 24, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class CategoryStatsResponse extends TagResponse {
  @ApiProperty({ description: "Сколько каналов сейчас в эфире" }) liveChannels: number;
  @ApiProperty({ description: "Суммарно зрителей" }) liveViewers: number;
  @ApiProperty({ description: "Входит в интересы зрителя" }) isInterest: boolean;
}

export class CategoryPageResponse {
  @ApiProperty({ type: CategoryStatsResponse }) category: CategoryStatsResponse;
  @ApiProperty({ type: [PublicChannelResponse] }) channels: PublicChannelResponse[];
}
