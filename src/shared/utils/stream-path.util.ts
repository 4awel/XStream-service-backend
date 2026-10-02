/**
 * MediaMTX присылает путь публикации. Он зависит от того, что стример вписал в OBS:
 *   сервер rtmp://host:1935        + ключ "<channelId>?key=..."  -> "<channelId>"
 *   сервер rtmp://host:1935/live   + ключ "<channelId>?key=..."  -> "live/<channelId>"
 * Берём последний сегмент, чтобы работали оба варианта.
 */
export const channelIdFromPath = (path: string | undefined): string | null => {
  const segments = (path ?? "").split("/").filter((segment) => segment.length > 0);
  return segments.at(-1) ?? null;
};
