export interface StreamKeyResponse {
  /** Поле «Сервер» в OBS. */
  server: string;
  /** Поле «Ключ потока» в OBS: "<channelId>?key=<ключ>". */
  streamKey: string;
  /** HLS-манифест своего канала — чтобы стример мог проверить себя. */
  playbackUrl: string;
}
