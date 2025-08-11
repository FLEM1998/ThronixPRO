import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from "crypto";

/**
 * Derive a 32-byte key from ENCRYPTION_KEY.
 * Must be set to a strong secret in the environment.
 */
const RAW_KEY = process.env.ENCRYPTION_KEY || "";
if (RAW_KEY.length < 16) {
  throw new Error("ENCRYPTION_KEY must be at least 16 characters long and set via environment variables");
}

const KEY = scryptSync(RAW_KEY, "thronix-salt", 32);

/**
 * Encrypt a UTF-8 string with AES-256-GCM.
 * Output format: ivHex:tagHex:cipherHex
 */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a string produced by `encrypt`.
 * Input format: ivHex:tagHex:cipherHex
 */
export function decrypt(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted payload format");
  const [ivHex, tagHex, cipherHex] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(cipherHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
