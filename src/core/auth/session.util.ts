import type { Request } from "express";

import "@/core/auth/session.types";

const promisify = (
  run: (done: (error?: unknown) => void) => void,
): Promise<void> =>
  new Promise<void>((resolve, reject) =>
    run((error) => (error ? reject(error) : resolve())),
  );

export const startSession = async (
  req: Request,
  userId: string,
): Promise<void> => {
  await promisify((done) => req.session.regenerate(done));

  req.session.userId = userId;

  await promisify((done) => req.session.save(done));
};

export const destroySession = (req: Request): Promise<void> =>
  promisify((done) => req.session.destroy(done));
