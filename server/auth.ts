import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase("cs");
}

export function validatePassword(password: string): void {
  if (password.length < 10) throw Object.assign(new Error("Heslo musí mít alespoň 10 znaků."), { code: "VALIDATION_ERROR", statusCode: 400 });
  if (password.length > 200) throw Object.assign(new Error("Heslo je příliš dlouhé."), { code: "VALIDATION_ERROR", statusCode: 400 });
}

export async function hashPassword(password: string, salt = randomBytes(16).toString("hex")): Promise<{ salt: string; hash: string }> {
  validatePassword(password);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return { salt, hash: derived.toString("hex") };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const derived = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(expectedHash, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function createSessionToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createInviteCode(): string {
  return randomBytes(6).toString("base64url").toUpperCase();
}

export function parseCookies(header = ""): Record<string, string> {
  return Object.fromEntries(header.split(";").map(part => part.trim()).filter(Boolean).map(part => {
    const separator = part.indexOf("=");
    return separator === -1 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
  }));
}
