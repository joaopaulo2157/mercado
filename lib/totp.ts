import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(input: string) {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const value = ALPHABET.indexOf(char);
    if (value < 0) return Buffer.alloc(0);
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8)
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(bytes);
}

function encodeBase32(input: Buffer) {
  let bits = "";
  for (const byte of input) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    output += ALPHABET[Number.parseInt(chunk, 2)];
  }
  return output;
}

function hotp(secret: Buffer, counter: number) {
  const data = Buffer.alloc(8);
  data.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", secret).update(data).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(value % 1_000_000).padStart(6, "0");
}

export function generateTotpSecret(bytes = 20) {
  return encodeBase32(randomBytes(Math.max(16, bytes)));
}

export function verifyTotp(secretBase32: string, code: string, now = Date.now()) {
  const secret = decodeBase32(secretBase32);
  const normalized = code.replace(/\D/g, "").slice(0, 6);
  if (secret.length < 10 || normalized.length !== 6) return false;
  const counter = Math.floor(now / 30_000);
  for (const offset of [-1, 0, 1]) {
    const expected = hotp(secret, counter + offset);
    const left = Buffer.from(normalized);
    const right = Buffer.from(expected);
    if (left.length === right.length && timingSafeEqual(left, right)) return true;
  }
  return false;
}

export function totpProvisioningUri(secret: string, email: string) {
  const issuer = "Supermercado Central";
  const label = `${issuer}:${email.trim().toLowerCase()}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function adminTotpConfigured() {
  return decodeBase32(String(process.env.ADMIN_TOTP_SECRET || "")).length >= 10;
}

export function verifyAdminTotp(code: string, now = Date.now()) {
  return verifyTotp(String(process.env.ADMIN_TOTP_SECRET || ""), code, now);
}
