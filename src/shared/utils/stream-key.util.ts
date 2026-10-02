import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "crypto";

const ALGO = "aes-256-gcm";

const getSecret = () => {
  const secret = process.env.STREAM_KEY_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error("STREAM_KEY_SECRET must be 64 hex chars (openssl rand -hex 32)");
  }
  return Buffer.from(secret, "hex");
};

export const generateStreamKey = () => randomBytes(24).toString("hex");

export const encryptStreamKey = (plain: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getSecret(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString("base64")).join(".");
};

export const decryptStreamKey = (stored: string): string => {
  const [iv, tag, data] = stored.split(".").map((s) => Buffer.from(s, "base64"));
  const decipher = createDecipheriv(ALGO, getSecret(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
};

export const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};