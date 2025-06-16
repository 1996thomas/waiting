import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const keyHex = process.env.ENCRYPTION_KEY;
if (!keyHex || keyHex.length !== 64) {
  throw new Error(
    "ENCRYPTION_KEY must be a 32‑byte hexadecimal string (64 characters)."
  );
}
const key = Buffer.from(keyHex, "hex");

export function encrypt(text: string): string {
  const iv = randomBytes(12); // 96‑bit IV recommended for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Store iv:tag:ciphertext in hex so we can easily split and decrypt later
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex)
    throw new Error("Invalid encrypted payload");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
