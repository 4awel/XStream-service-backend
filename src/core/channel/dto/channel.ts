import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

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
