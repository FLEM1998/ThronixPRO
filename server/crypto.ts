import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

/**
 * Derives a 32‑byte encryption key from the provided secret. In production
 * the ENCRYPTION_KEY environment variable **must** be provided and strong.
 * A static salt is used here to ensure deterministic key generation across
 * app restarts. If ENCRYPTION_KEY is too short, an error is thrown to
 * prevent weak encryption. See README for details.
 */
const RAW_KEY = process.env.ENCRYPTION_KEY || '';
if (RAW_KEY.length < 16) {
  throw new Error(
    'ENCRYPTION_KEY must be at least 16 characters long and set via environment variables',
  );
}

// Derive a fixed-length key using scrypt. This prevents use of the raw
// passphrase directly as an AES key and adds computational hardness.
const KEY = scryptSync(RAW_KEY, 'thronix-salt', 32);

/**
 * Encrypt a UTF‑8 string using AES‑256‑GCM. A random IV is generated for
 * each encryption operation and prepended to the output along with the
 * authentication tag. The resulting string format is:
 *   ivHex:tagHex:cipherHex
 * Decoding is handled by the corresponding `decrypt` function.
 */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a string previously produced by `encrypt`. The input must be
 * formatted as iv:tag:cipher, where each segment is hex‑encoded. If
 * authentication fails (e.g. wrong key or corrupted data) an error is
 * thrown.
 */
export function decrypt(payload: string): string {
  const [ivHex, tagHex, cipherHex] = payload.split(':');
  if (!ivHex || !tagHex || !cipherHex) {
    throw new Error('Invalid encrypted payload format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(cipherHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
