import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_BYTES = 64;

export function validateAdminPassword(password: string) {
  if (password.length < 12) throw new Error("A senha deve ter pelo menos 12 caracteres");
  if (password.length > 256) throw new Error("A senha é longa demais");
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password))
    throw new Error("Use letras maiúsculas, minúsculas e números na senha");
}

export function hashAdminPassword(password: string) {
  validateAdminPassword(password);
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, HASH_BYTES).toString("hex");
  return { salt, hash };
}

export function verifyAdminPasswordHash(password: string, salt: string, expectedHash: string) {
  if (!password || !salt || !expectedHash) return false;
  try {
    const actual = Buffer.from(scryptSync(password, salt, HASH_BYTES).toString("hex"), "hex");
    const expected = Buffer.from(expectedHash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
