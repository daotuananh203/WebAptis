/**
 * Cryptographic Password Hashing & Verification
 * Uses Node.js standard scrypt with unique cryptographic salt per user.
 */

import crypto from "crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Hash a plain-text password using scrypt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return {
    hash: derivedKey.toString("hex"),
    salt,
  };
}

/**
 * Verify a plain-text password against a stored hash and salt.
 */
export function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, storedSalt, KEY_LENGTH);
    const keyBuffer = Buffer.from(derivedKey.toString("hex"), "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (keyBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(keyBuffer, storedBuffer);
  } catch {
    return false;
  }
}
