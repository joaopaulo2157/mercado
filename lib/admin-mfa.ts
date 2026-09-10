import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey() {
  const secret = String(process.env.ADMIN_SESSION_SECRET || "");
  if (secret.length < 32)
    throw new Error("ADMIN_SESSION_SECRET deve ter pelo menos 32 caracteres para proteger o 2FA");
  return createHash("sha256").update(secret).digest();
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptTotpSecret(payload: string) {
  const [ivRaw, tagRaw, cipherRaw, ...extra] = String(payload || "").split(".");
  if (!ivRaw || !tagRaw || !cipherRaw || extra.length) return "";
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivRaw, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(cipherRaw, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}
