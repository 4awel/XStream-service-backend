import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class StreamKeyResponse {
  @ApiProperty({
    description: "Адрес RTMP-сервера для поля «Сервер» в OBS",
    example: "rtmp://localhost:1935",
  })
  @IsString()
  server: string;

  @ApiProperty({
    description: "Поле «Ключ потока» в OBS целиком",
    example: "8f1c...-channel-id?key=4b7e...",
  })
  @IsString()
  streamKey: string;

  @ApiProperty({
    description: "HLS-манифест своего канала для проверки трансляции",
    example: "http://localhost:8888/8f1c...-channel-id/index.m3u8",
  })
  @IsString()
  playbackUrl: string;
}

export class ChatHistoryQuery {
  @ApiPropertyOptional({ description: "id самого старого загруженного сообщения" })
  @IsOptional()
  @IsString()
  before?: string;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ChatMessageResponse {
  @ApiProperty() id: string;
  @ApiProperty() channelId: string;
  @ApiProperty() userId: string;
  @ApiProperty() username: string;
  @ApiProperty() text: string;
  @ApiProperty({ description: "ISO-строка" }) createdAt: string;
}

export class ChatHistoryResponse {
  @ApiProperty({ type: [ChatMessageResponse] })
  items: ChatMessageResponse[];

  @ApiProperty({ description: "Есть ли сообщения старше первого в items" })
  hasMore: boolean;
}
