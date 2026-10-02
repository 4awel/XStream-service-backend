import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

/**
 * Вебхуки получают путь строкой запроса: ?path=<channelId>.
 * Здесь DTO уместен — URL формируем мы сами в mediamtx.yml, сюрпризов не будет.
 * А вот тело /stream/auth разбирается руками, см. stream-auth.request.ts.
 */
export class StreamHookQueryDto {
  @ApiProperty({ description: "Путь публикации из MediaMTX" })
  @IsString()
  path: string;
}
