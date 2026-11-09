import crypto from "crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";

/**
 * Derive a 32-byte AES-256 key unique to this user.
 * Uses HMAC-SHA256 so each user has a different key even
 * if the server secret is compromised in isolation.
 */
function deriveKey(userId) {
  return crypto
    .createHmac("sha256", env.encryptionSecret)
    .update(String(userId))
    .digest(); // 32 bytes
}

/**
 * Encrypt plaintext for a given userId.
 * Returns a single base64 string: "iv:authTag:ciphertext"
 */
export function encrypt(plaintext, userId) {
  const key = deriveKey(userId);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(String(plaintext), "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return [iv.toString("base64"), authTag, encrypted].join(":");
}

/**
 * Decrypt a "iv:authTag:ciphertext" string for a given userId.
 * Returns the original plaintext string.
 */
export function decrypt(cipherString, userId) {
  const [ivB64, authTagB64, encryptedB64] = cipherString.split(":");
  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted data format.");
  }

  const key = deriveKey(userId);
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedB64, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
