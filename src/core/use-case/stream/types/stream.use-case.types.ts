export const MEDIAMTX_ACTIONS = [
  "publish",
  "read",
  "playback",
  "api",
  "metrics",
  "pprof",
] as const;

export type MediaMtxAction = (typeof MEDIAMTX_ACTIONS)[number];

export interface MediaMtxAuthInput {
  action: MediaMtxAction;
  path?: string;
  query?: string;
  protocol?: string;
  ip?: string;
}
