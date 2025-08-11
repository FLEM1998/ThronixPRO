import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from "crypto";

const RAW_KEY = process.env.ENCRYPTION_KEY || "";
if (RAW_KEY.length < 16) throw new Error("ENCRYPTION_KEY must be set and strong");

// Derive a fixed 32-byte key from your secret (salt is constant app-wide)
const KEY = scryptSync(RAW_KEY, "thronix-salt", 32);

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, encHex] = payload.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}
